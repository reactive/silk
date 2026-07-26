import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avatarRecipe,
  boxRecipe,
  buttonRecipe,
  centerRecipe,
  containerRecipe,
  dialogRecipe,
  gridRecipe,
  inlineRecipe,
  separatorRecipe,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { containerBreakpointNames } from '../layout/containerBreakpoints';

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.css',
);

function loadCss(): string {
  return readFileSync(cssPath, 'utf8');
}

function assertAxisSelectors(
  css: string,
  attr: string,
  values: readonly string[],
): void {
  for (const value of values) {
    expect(css).toContain(`${attr}="${value}"`);
  }
}

test('recipe conformance: every Button variant value has a CSS rule', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-variant', buttonRecipe.variants.variant);
  assertAxisSelectors(css, 'data-tone', buttonRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', buttonRecipe.variants.size);
  assertAxisSelectors(css, 'data-density', buttonRecipe.variants.density);
});

test('recipe conformance: Text, Stack, Avatar, Dialog axes are styled', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-role', textRecipe.variants.role);
  assertAxisSelectors(css, 'data-direction', stackRecipe.variants.direction);
  assertAxisSelectors(css, 'data-gap', stackRecipe.variants.gap);
  assertAxisSelectors(css, 'data-align', stackRecipe.variants.align);
  assertAxisSelectors(css, 'data-wrap', stackRecipe.variants.wrap);
  assertAxisSelectors(css, 'data-size', avatarRecipe.variants.size);
  assertAxisSelectors(css, 'data-shape', avatarRecipe.variants.shape);
  assertAxisSelectors(css, 'data-size', dialogRecipe.variants.size);
});

test('recipe conformance: layout component axes are styled', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-padding', boxRecipe.variants.padding);
  assertAxisSelectors(css, 'data-gap', inlineRecipe.variants.gap);
  assertAxisSelectors(css, 'data-align', inlineRecipe.variants.align);
  assertAxisSelectors(css, 'data-justify', inlineRecipe.variants.justify);
  assertAxisSelectors(css, 'data-wrap', inlineRecipe.variants.wrap);
  assertAxisSelectors(css, 'data-columns', gridRecipe.variants.columns);
  assertAxisSelectors(css, 'data-axis', centerRecipe.variants.axis);
  assertAxisSelectors(css, 'data-size', containerRecipe.variants.size);
  assertAxisSelectors(css, 'data-padding', containerRecipe.variants.padding);
  assertAxisSelectors(
    css,
    'data-orientation',
    separatorRecipe.variants.orientation,
  );
});

test('density remaps space vars and collapseBelow container queries exist', () => {
  const css = loadCss();
  expect(css).toContain('--silk-space-compact-2');
  expect(css).toContain('--silk-space-comfortable-2');
  expect(css).toContain('data-density="compact"');
  expect(css).toContain('data-density="comfortable"');
  // Effective aliases must come from densityClass, not themeToCssVars inline/theme blocks.
  expect(css).toMatch(
    /--silk-space-2:\s*var\(--silk-space-comfortable-2\)/,
  );
  expect(css).toMatch(/--silk-space-2:\s*var\(--silk-space-compact-2\)/);
  for (const name of containerBreakpointNames) {
    expect(css).toContain(`data-collapse-below="${name}"`);
  }
  expect(css).toContain('@container');
});

/**
 * collapseBelow must share each component's Linaria class and appear after
 * direction/base and align rules so equal-specificity source order wins for
 * both `flex-direction: column` and `align-items: stretch`.
 */
test('collapseBelow rules follow Stack/Inline direction and align in CSS', () => {
  const css = loadCss();
  const escape = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function collapseBlock(className: string): string {
    const match = css.match(
      new RegExp(
        `\\.${escape(className)}:where\\(\\[data-collapse-below="md"\\]\\)\\s*\\{([^}]+)\\}`,
      ),
    );
    expect(match).not.toBeNull();
    return match![1];
  }

  function assertCollapseAfter(earlierNeedle: string, className: string): void {
    const earlierIdx = css.indexOf(earlierNeedle);
    expect(earlierIdx).toBeGreaterThan(-1);
    const collapseIdx = css.indexOf(
      `.${className}:where([data-collapse-below="md"])`,
    );
    expect(collapseIdx).toBeGreaterThan(earlierIdx);
    const body = collapseBlock(className);
    expect(body).toContain('flex-direction: column');
    expect(body).toContain('align-items: stretch');
  }

  // Stack: direction + align on the same hashed class as collapseBelow.
  const stackDirection = css.match(
    /\.([a-zA-Z0-9_-]+):where\(\[data-direction="row"\]\)\s*\{[^}]*flex-direction:\s*row/,
  );
  expect(stackDirection).not.toBeNull();
  const stackClass = stackDirection![1];
  assertCollapseAfter(stackDirection![0], stackClass);
  assertCollapseAfter(
    `.${stackClass}:where([data-align="center"])`,
    stackClass,
  );

  // Inline: identify via justify axis (Inline-only), then check row base + align.
  const inlineJustify = css.match(
    /\.([a-zA-Z0-9_-]+):where\(\[data-justify="start"\]\)/,
  );
  expect(inlineJustify).not.toBeNull();
  const inlineClass = inlineJustify![1];
  const inlineBase = css.match(
    new RegExp(
      `\\.${escape(inlineClass)}\\s*\\{[^}]*flex-direction:\\s*row`,
    ),
  );
  expect(inlineBase).not.toBeNull();
  assertCollapseAfter(inlineBase![0], inlineClass);
  assertCollapseAfter(
    `.${inlineClass}:where([data-align="center"])`,
    inlineClass,
  );
});
