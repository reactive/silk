import { expect, test } from '@rstest/core';
import { loadDistCss } from '../test/distCss';
import { silkComponentVarNames } from './componentVars';

/**
 * Theme-layer namespaces — owned by `themeToCssVars`, not component hooks.
 * A new namespace added there without a matching entry here fails the first
 * test below, reported as an undeclared component hook. Fail-loud is the point:
 * the two lists must be curated together.
 */
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

test('no undeclared --silk-* hook leaks into the stylesheet', () => {
  const inCss = extractComponentVars(loadDistCss());
  expect([...inCss].sort()).toEqual([...silkComponentVarNames].sort());
});

test('every hook is overridable — declared with a fallback, never assigned', () => {
  const css = loadDistCss();
  for (const name of silkComponentVarNames) {
    // `--silk-button-bg: …` on the component itself would shadow the consumer.
    expect(css).not.toMatch(new RegExp(`${name}\\s*:`));
    expect(css).toContain(`var(${name},`);
  }
});
