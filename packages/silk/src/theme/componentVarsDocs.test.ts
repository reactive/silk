import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { formatComponentVarDocsTable } from './componentVars';

const themingMdx = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../apps/docs/src/Theming.mdx',
);

test('Theming.mdx component-var table matches silkComponentVarMeta', () => {
  const source = readFileSync(themingMdx, 'utf8');
  const start = source.indexOf('{/* COMPONENT_VAR_TABLE_START */}');
  const end = source.indexOf('{/* COMPONENT_VAR_TABLE_END */}');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const table = source
    .slice(start, end)
    .replace('{/* COMPONENT_VAR_TABLE_START */}', '')
    .trim();
  expect(table).toBe(formatComponentVarDocsTable());
});
