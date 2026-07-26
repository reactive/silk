import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';

const componentsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(componentsDir, '../../../..');
const registryDir = join(repoRoot, 'registry');

function componentSources(): readonly string[] {
  return readdirSync(componentsDir)
    .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
    .map((file) => join(componentsDir, file));
}

function registrySources(): readonly string[] {
  return readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(registryDir, entry.name))
        .filter((file) => file.endsWith('.tsx'))
        .map((file) => join(registryDir, entry.name, file)),
    );
}

const removedApis = [
  ['Center', /\bCenter\b/],
  ['Stack direction', /<Stack[^>]*\sdirection=/],
  ['Stack wrap', /<Stack[^>]*\swrap=/],
  ['Stack collapseBelow', /<Stack[^>]*\scollapseBelow=/],
] as const;

/**
 * Registry sources are generated copies of the composites, so a missed
 * `sync-registry` surfaces here rather than in a consumer's install.
 */
test('composites and registry sources use no removed layout API', () => {
  const violations: string[] = [];
  for (const path of [...componentSources(), ...registrySources()]) {
    const source = readFileSync(path, 'utf8');
    for (const [label, pattern] of removedApis) {
      if (pattern.test(source)) {
        violations.push(`${relative(repoRoot, path)}: ${label}`);
      }
    }
  }
  expect(violations).toEqual([]);
});
