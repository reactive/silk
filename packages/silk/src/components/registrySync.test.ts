import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { listRegistrySources } from '../test/registrySources';

const componentsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(componentsDir, '../../../..');
const packageIndex = join(repoRoot, 'packages/silk/src/index.ts');
const syncScript = join(repoRoot, 'scripts/sync-registry.mjs');

/** Parse `{ a as b, type C }` → imported (source) + local (binding) names. */
function parseNamedBindings(
  clause: string,
): readonly { imported: string; local: string }[] {
  const bindings: { imported: string; local: string }[] = [];
  for (const part of clause.split(',')) {
    const cleaned = part.trim().replace(/^type\s+/, '');
    if (!cleaned) continue;
    const [imported, alias] = cleaned.split(/\s+as\s+/).map((s) => s.trim());
    if (!imported) continue;
    bindings.push({ imported, local: alias || imported });
  }
  return bindings;
}

function publicExportNames(indexSource: string): ReadonlySet<string> {
  const names = new Set<string>();
  for (const match of indexSource.matchAll(
    /export\s+(?:type\s+)?\{([^}]+)\}/g,
  )) {
    for (const { local } of parseNamedBindings(match[1])) {
      names.add(local);
    }
  }
  return names;
}

function snapshotRegistry(): Map<string, string> {
  const snap = new Map<string, string>();
  snap.set(
    'registry.json',
    readFileSync(join(repoRoot, 'registry.json'), 'utf8'),
  );
  for (const path of listRegistrySources(repoRoot)) {
    snap.set(relative(repoRoot, path), readFileSync(path, 'utf8'));
  }
  return snap;
}

/**
 * Registry composites may import `@reactive/silk` only for public package
 * exports. Internal helpers must ship as companion files (sync-registry).
 */
test('registry @reactive/silk imports resolve to public package exports', () => {
  const publicNames = publicExportNames(readFileSync(packageIndex, 'utf8'));
  const violations: string[] = [];

  for (const path of listRegistrySources(repoRoot)) {
    const source = readFileSync(path, 'utf8');
    const importRe =
      /import\s+(type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]@reactive\/silk['"]/g;
    for (const match of source.matchAll(importRe)) {
      const names: string[] = [];
      if (match[2]) {
        names.push(match[2]);
      }
      if (match[3]) {
        for (const { imported } of parseNamedBindings(match[3])) {
          names.push(imported);
        }
      }
      for (const name of names) {
        if (!publicNames.has(name)) {
          violations.push(
            `${relative(repoRoot, path)}: ${name} is not a public @reactive/silk export`,
          );
        }
      }
    }
  }

  expect(violations).toEqual([]);
});

const PRIVATE_COMPANIONS = [
  {
    file: 'registry/comment/formatTimestamp.ts',
    importedFrom: 'registry/comment/comment.tsx',
    importPat: /from ['"]\.\/formatTimestamp['"]/,
  },
  {
    file: 'registry/post-card/formatTimestamp.ts',
    importedFrom: 'registry/post-card/post-card.tsx',
    importPat: /from ['"]\.\/formatTimestamp['"]/,
  },
  {
    file: 'registry/notification/formatTimestamp.ts',
    importedFrom: 'registry/notification/notification.tsx',
    importPat: /from ['"]\.\/formatTimestamp['"]/,
  },
  {
    file: 'registry/profile-card/ActionDescriptorButton.tsx',
    importedFrom: 'registry/profile-card/profile-card.tsx',
    importPat: /from ['"]\.\/ActionDescriptorButton['"]/,
    companionImportPat: /from ['"]@reactive\/silk['"]/,
  },
  {
    file: 'registry/status-dot/tonePrivateVars.ts',
    importedFrom: 'registry/status-dot/status-dot.tsx',
    importPat: /from ['"]\.\/tonePrivateVars['"]/,
  },
] as const;

test('sync-registry emits companions for private helpers and is idempotent', () => {
  const before = snapshotRegistry();
  execFileSync(process.execPath, [syncScript], { cwd: repoRoot, stdio: 'pipe' });
  const after = snapshotRegistry();

  for (const companion of PRIVATE_COMPANIONS) {
    expect(after.has(companion.file)).toBe(true);
    expect(after.get(companion.file)!.length).toBeGreaterThan(0);
    expect(after.get(companion.importedFrom)).toMatch(companion.importPat);
    if ('companionImportPat' in companion && companion.companionImportPat) {
      expect(after.get(companion.file)).toMatch(companion.companionImportPat);
    }
  }

  const statusDotItem = JSON.parse(after.get('registry.json')!).items.find(
    (item: { name: string }) => item.name === 'status-dot',
  );
  expect(statusDotItem.dependencies).toContain('@linaria/core');
  expect(statusDotItem.files.map((f: { path: string }) => f.path)).toEqual(
    expect.arrayContaining([
      'registry/status-dot/status-dot.tsx',
      'registry/status-dot/tonePrivateVars.ts',
    ]),
  );

  expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
  for (const [path, content] of after) {
    expect({ path, content }).toEqual({ path, content: before.get(path) });
  }
});
