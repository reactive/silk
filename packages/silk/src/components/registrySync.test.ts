import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';

const componentsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(componentsDir, '../../../..');
const registryDir = join(repoRoot, 'registry');
const packageIndex = join(repoRoot, 'packages/silk/src/index.ts');
const syncScript = join(repoRoot, 'scripts/sync-registry.mjs');

function registrySources(): readonly string[] {
  return readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(registryDir, entry.name))
        .filter((file) => /\.(tsx?|css\.ts)$/.test(file))
        .map((file) => join(registryDir, entry.name, file)),
    );
}

function publicExportNames(indexSource: string): ReadonlySet<string> {
  const names = new Set<string>();
  for (const match of indexSource.matchAll(
    /export\s+(?:type\s+)?\{([^}]+)\}/g,
  )) {
    for (const part of match[1].split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
        ?.trim();
      if (name) {
        names.add(name);
      }
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
  for (const path of registrySources()) {
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

  for (const path of registrySources()) {
    const source = readFileSync(path, 'utf8');
    const importRe =
      /import\s+(type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]@reactive\/silk['"]/g;
    for (const match of source.matchAll(importRe)) {
      const names: string[] = [];
      if (match[2]) {
        names.push(match[2]);
      }
      if (match[3]) {
        for (const part of match[3].split(',')) {
          const binding = part
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]
            ?.trim();
          if (binding) {
            names.push(binding);
          }
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

test('sync-registry emits companions for private helpers and is idempotent', () => {
  const before = snapshotRegistry();
  execFileSync(process.execPath, [syncScript], { cwd: repoRoot, stdio: 'pipe' });
  const after = snapshotRegistry();

  expect(after.get('registry/comment/formatTimestamp.ts')?.length).toBeGreaterThan(
    0,
  );
  expect(
    after.get('registry/post-card/formatTimestamp.ts')?.length,
  ).toBeGreaterThan(0);
  expect(
    after.get('registry/notification/formatTimestamp.ts')?.length,
  ).toBeGreaterThan(0);
  expect(
    after.get('registry/profile-card/ActionDescriptorButton.tsx')?.length,
  ).toBeGreaterThan(0);
  expect(
    after.get('registry/status-dot/tonePrivateVars.ts')?.length,
  ).toBeGreaterThan(0);

  expect(after.get('registry/comment/comment.tsx')).toMatch(
    /from ['"]\.\/formatTimestamp['"]/,
  );
  expect(after.get('registry/profile-card/profile-card.tsx')).toMatch(
    /from ['"]\.\/ActionDescriptorButton['"]/,
  );
  expect(after.get('registry/profile-card/ActionDescriptorButton.tsx')).toMatch(
    /from ['"]@reactive\/silk['"]/,
  );
  expect(after.get('registry/status-dot/status-dot.tsx')).toMatch(
    /from ['"]\.\/tonePrivateVars['"]/,
  );

  const statusDotItem = JSON.parse(after.get('registry.json') ?? '{}').items.find(
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
