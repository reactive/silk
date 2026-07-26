import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { listRegistrySources } from '../test/registrySources';

const componentsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(componentsDir, '../../../..');

function componentSources(): readonly string[] {
  return readdirSync(componentsDir)
    .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
    .map((file) => join(componentsDir, file));
}

const removedApis = [
  ['Center', /(?:import\s+\{[^}]*\bCenter\b|<Center[\s/>])/],
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
  for (const path of [...componentSources(), ...listRegistrySources(repoRoot)]) {
    const source = readFileSync(path, 'utf8');
    for (const [label, pattern] of removedApis) {
      if (pattern.test(source)) {
        violations.push(`${relative(repoRoot, path)}: ${label}`);
      }
    }
  }
  expect(violations).toEqual([]);
});
