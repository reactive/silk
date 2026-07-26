import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { silkComponentVarNames } from './componentVars';

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.css',
);

/** Theme-layer namespaces — owned by `themeToCssVars`, not component hooks. */
const tokenNamespaces = new Set([
  'color',
  'focus',
  'motion',
  'radius',
  'shadow',
  'space',
  'typography',
]);

/**
 * Private plumbing that happens to use the public prefix because it crosses
 * elements (`--_x` cannot inherit through a portal boundary the same way).
 */
const internalNamespaces = new Set(['float']);

function extractComponentVars(css: string): Set<string> {
  const found = new Set<string>();
  for (const match of css.matchAll(/--silk-([a-z0-9]+)[a-z0-9-]*/g)) {
    const namespace = match[1];
    if (tokenNamespaces.has(namespace) || internalNamespaces.has(namespace)) {
      continue;
    }
    found.add(match[0]);
  }
  return found;
}

test('public component hooks match the extracted stylesheet exactly', () => {
  const inCss = extractComponentVars(readFileSync(cssPath, 'utf8'));
  expect([...inCss].sort()).toEqual([...silkComponentVarNames].sort());
});

test('every hook is overridable — declared with a fallback, never assigned', () => {
  const css = readFileSync(cssPath, 'utf8');
  for (const name of silkComponentVarNames) {
    // `--silk-button-bg: …` on the component itself would shadow the consumer.
    expect(css).not.toMatch(new RegExp(`${name}\\s*:`));
    expect(css).toContain(`var(${name},`);
  }
});
