#!/usr/bin/env node
/**
 * Sync composite sources into registry/<name>/ for consumer-owned installs.
 *
 * Relative imports that resolve to modules re-exported from `@reactive/silk`
 * are rewritten to the package entry. Non-public helpers (e.g. formatTimestamp,
 * ActionDescriptorButton, tonePrivateVars) are emitted as companion files in
 * the same registry item directory, with relative imports preserved.
 *
 * Stage 7 finalizes pinning, cross-item registryDependencies, and
 * publish-from-tag semantics.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'packages/silk/src');
const componentsDir = join(srcRoot, 'components');

const COMPOSITES = [
  'Identity',
  'StatusDot',
  'MediaObject',
  'ActionBar',
  'StatGroup',
  'EmptyState',
  'PostCard',
  'Comment',
  'CommentThread',
  'Notification',
  'ProfileCard',
  'SettingsPanel',
  'FeedItem',
];

/** Matches `from '…'` / `from "…"`. */
const FROM_RE = /from\s+['"]([^'"]+)['"]/g;

/** Packages registry consumers already have (or that are framework peers). */
const IMPLICIT_DEPS = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]);

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveSourceFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }
  const base = resolve(dirname(fromFile), specifier);
  const fileCandidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.css.ts`];
  for (const candidate of fileCandidates) {
    if (isFile(candidate)) {
      return candidate;
    }
  }
  for (const index of ['index.ts', 'index.tsx']) {
    const candidate = join(base, index);
    if (isFile(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Cannot resolve '${specifier}' from ${fromFile}`);
}

function listFromSpecifiers(source) {
  return [...source.matchAll(FROM_RE)].map((match) => match[1]);
}

/**
 * Walk `export { Name } from '…'` chains from the package root so only modules
 * that actually surface through `@reactive/silk` count as public.
 *
 * @returns {Set<string>} absolute source paths
 */
function collectPublicModules() {
  const publicModules = new Set();
  const rootIndex = join(srcRoot, 'index.ts');

  /**
   * @param {string} fromFile
   * @param {Set<string> | null} wantedNames null = accept every named re-export
   */
  function visit(fromFile, wantedNames) {
    const source = readFileSync(fromFile, 'utf8');
    const exportRe =
      /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    for (const match of source.matchAll(exportRe)) {
      const specifier = match[2];
      if (!specifier.startsWith('.')) {
        continue;
      }

      const exported = [];
      for (const part of match[1].split(',')) {
        const cleaned = part.trim().replace(/^type\s+/, '');
        if (!cleaned) continue;
        const [original, alias] = cleaned.split(/\s+as\s+/).map((s) => s.trim());
        const publicName = alias || original;
        if (wantedNames && !wantedNames.has(publicName)) {
          continue;
        }
        exported.push(original);
      }
      if (exported.length === 0) {
        continue;
      }

      const resolved = resolveSourceFile(fromFile, specifier);
      const base = basename(resolved);
      if (base === 'index.ts' || base === 'index.tsx') {
        visit(resolved, new Set(exported));
      } else {
        publicModules.add(resolved);
      }
    }
  }

  visit(rootIndex, null);
  return publicModules;
}

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return null;
  }
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split('/')[0];
}

/**
 * Walk the entry module and every non-public relative dependency, emitting
 * companions into outDir. Public relative imports become `@reactive/silk`.
 */
function emitRegistryItem(entryAbsPath, outDir, entryOutName, publicModules) {
  /** @type {Map<string, string>} absPath → emitted basename (with extension) */
  const emittedNames = new Map();
  emittedNames.set(entryAbsPath, entryOutName);

  const queue = [entryAbsPath];
  while (queue.length > 0) {
    const absPath = queue.shift();
    const source = readFileSync(absPath, 'utf8');
    for (const specifier of listFromSpecifiers(source)) {
      if (!specifier.startsWith('.')) {
        continue;
      }
      const resolved = resolveSourceFile(absPath, specifier);
      if (publicModules.has(resolved) || emittedNames.has(resolved)) {
        continue;
      }
      const outName = basename(resolved);
      for (const [otherAbs, otherName] of emittedNames) {
        if (otherName === outName && otherAbs !== resolved) {
          throw new Error(
            `Registry basename collision: ${outName} from ${resolved} and ${otherAbs}`,
          );
        }
      }
      emittedNames.set(resolved, outName);
      queue.push(resolved);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const written = [];
  for (const [absPath, outName] of emittedNames) {
    const isEntry = absPath === entryAbsPath;
    const body = readFileSync(absPath, 'utf8').replace(
      FROM_RE,
      (full, specifier) => {
        if (!specifier.startsWith('.')) {
          return full;
        }
        const resolved = resolveSourceFile(absPath, specifier);
        if (publicModules.has(resolved)) {
          return "from '@reactive/silk'";
        }
        const companion = emittedNames.get(resolved);
        if (!companion) {
          throw new Error(
            `Missing companion mapping for ${resolved} (from ${absPath})`,
          );
        }
        // Match package source style: extensionless, except `.css` for *.css.ts.
        if (companion.endsWith('.css.ts')) {
          return `from './${companion.slice(0, -'.ts'.length)}'`;
        }
        return `from './${companion.replace(/\.tsx?$/, '')}'`;
      },
    );

    const outPath = join(outDir, outName);
    writeFileSync(outPath, body);
    written.push({ absPath, outName, outPath, isEntry, body });
  }

  return written;
}

function collectDependencies(bodies) {
  const deps = new Set(['@reactive/silk']);
  for (const body of bodies) {
    for (const specifier of listFromSpecifiers(body)) {
      const pkg = packageNameFromSpecifier(specifier);
      if (!pkg || IMPLICIT_DEPS.has(pkg) || IMPLICIT_DEPS.has(specifier)) {
        continue;
      }
      deps.add(pkg);
    }
  }
  return [...deps];
}

const publicModules = collectPublicModules();
const items = [];

for (const name of COMPOSITES) {
  const kebab = toKebab(name);
  const srcPath = join(componentsDir, `${name}.tsx`);
  const outDir = join(root, 'registry', kebab);
  const entryOutName = `${kebab}.tsx`;

  if (!existsSync(srcPath)) {
    throw new Error(`Missing composite source: ${srcPath}`);
  }

  const written = emitRegistryItem(
    srcPath,
    outDir,
    entryOutName,
    publicModules,
  );

  const entry = written.find((file) => file.isEntry);
  const banner = `/**\n * ${name} composite — synced from packages/silk/src/components/${name}.tsx\n * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.\n */\n`;
  writeFileSync(entry.outPath, banner + entry.body);

  const bodies = written.map((file) =>
    file.isEntry ? banner + file.body : file.body,
  );

  items.push({
    name: kebab,
    type: 'registry:component',
    title: name,
    description: `${name} composite. Built on @reactive/silk primitives — zero Tailwind.`,
    dependencies: collectDependencies(bodies),
    files: written.map((file) => ({
      path: `registry/${kebab}/${file.outName}`,
      type: 'registry:component',
    })),
  });
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'silk',
  homepage: 'https://github.com/reactive/silk',
  items,
};

writeFileSync(
  join(root, 'registry.json'),
  `${JSON.stringify(registry, null, 2)}\n`,
);

console.log(`Synced ${COMPOSITES.length} composites into registry/`);
