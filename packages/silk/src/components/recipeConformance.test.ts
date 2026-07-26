import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
  centerRecipe,
  checkboxRecipe,
  containerRecipe,
  dialogRecipe,
  gridRecipe,
  headingRecipe,
  inlineRecipe,
  inputRecipe,
  progressRecipe,
  radioGroupRecipe,
  separatorRecipe,
  skeletonRecipe,
  popoverRecipe,
  selectRecipe,
  sliderRecipe,
  spinnerRecipe,
  stackRecipe,
  surfaceRecipe,
  switchRecipe,
  tabsRecipe,
  textRecipe,
  textareaRecipe,
  toastRecipe,
  toggleRecipe,
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

test('recipe conformance: Stage 2 visual and form axes are styled', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-elevation', surfaceRecipe.variants.elevation);
  assertAxisSelectors(css, 'data-radius', surfaceRecipe.variants.radius);
  assertAxisSelectors(css, 'data-border', surfaceRecipe.variants.border);
  assertAxisSelectors(css, 'data-elevation', cardRecipe.variants.elevation);
  assertAxisSelectors(css, 'data-padding', cardRecipe.variants.padding);
  // Heading `level` selects the HTML tag only — not a CSS axis.
  assertAxisSelectors(css, 'data-size', headingRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', headingRecipe.variants.tone);
  assertAxisSelectors(css, 'data-variant', badgeRecipe.variants.variant);
  assertAxisSelectors(css, 'data-tone', badgeRecipe.variants.tone);
  assertAxisSelectors(css, 'data-shape', skeletonRecipe.variants.shape);
  assertAxisSelectors(css, 'data-size', spinnerRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', spinnerRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', progressRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', progressRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', inputRecipe.variants.size);
  assertAxisSelectors(css, 'data-size', textareaRecipe.variants.size);
  assertAxisSelectors(css, 'data-size', checkboxRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', checkboxRecipe.variants.tone);
  assertAxisSelectors(css, 'data-orientation', radioGroupRecipe.variants.orientation);
  assertAxisSelectors(css, 'data-size', radioGroupRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', radioGroupRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', switchRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', switchRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', sliderRecipe.variants.size);
  assertAxisSelectors(css, 'data-tone', sliderRecipe.variants.tone);
  expect(css).toContain('--silk-shadow-raised');
  expect(css).toContain('--silk-color-surface-sunken');
  expect(css).toContain('--silk-color-overlay');
  expect(css).toContain('prefers-reduced-motion');
});

test('recipe conformance: Stage 3 interaction axes and floating motion', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-size', popoverRecipe.variants.size);
  assertAxisSelectors(css, 'data-variant', tabsRecipe.variants.variant);
  assertAxisSelectors(css, 'data-size', selectRecipe.variants.size);
  assertAxisSelectors(css, 'data-density', selectRecipe.variants.density);
  assertAxisSelectors(css, 'data-tone', toastRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', toggleRecipe.variants.size);
  expect(css).toContain('silk-float-in');
  expect(css).toContain('silk-float-out');
  expect(css).toContain('silk-overlay-in');
  expect(css).toContain('silk-overlay-out');
  expect(css).toContain('silk-dialog-panel-in');
  expect(css).toContain('silk-dialog-panel-out');
  expect(css).toContain('silk-accordion-open');
  expect(css).toContain('silk-accordion-close');
});

test('looping animations use the loop motion token, not transition durations', () => {
  const css = loadCss();
  const infiniteAnimations = css.match(/animation:[^;]*infinite/g) ?? [];

  // Skeleton shimmer, Progress indeterminate shimmer, Spinner rotation.
  expect(infiniteAnimations.length).toBeGreaterThanOrEqual(3);
  for (const declaration of infiniteAnimations) {
    expect(declaration).toContain('--silk-motion-loop-duration-ms');
    // fast/normal/slow are one-shot transitions; a loop bound to them runs
    // an order of magnitude too fast.
    expect(declaration).not.toMatch(/--silk-motion-(fast|normal|slow)-/);
  }
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
 * direction/base and align rules so equal-specificity source order wins.
 * Stack guards stretch so already-column keeps align; Inline always stretches.
 */
test('collapseBelow rules follow Stack/Inline direction and align in CSS', () => {
  const css = loadCss();
  const escape = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function collapsePlainBlock(className: string): string {
    const match = css.match(
      new RegExp(
        `\\.${escape(className)}:where\\(\\[data-collapse-below="md"\\]\\)\\s*\\{([^}]+)\\}`,
      ),
    );
    expect(match).not.toBeNull();
    return match![1];
  }

  function assertAfter(earlierNeedle: string, laterNeedle: string): void {
    const earlierIdx = css.indexOf(earlierNeedle);
    const laterIdx = css.indexOf(laterNeedle);
    expect(earlierIdx).toBeGreaterThan(-1);
    expect(laterIdx).toBeGreaterThan(earlierIdx);
  }

  // Stack: direction collapses; stretch only when not already column.
  const stackDirection = css.match(
    /\.([a-zA-Z0-9_-]+):where\(\[data-direction="row"\]\)\s*\{[^}]*flex-direction:\s*row/,
  );
  expect(stackDirection).not.toBeNull();
  const stackClass = stackDirection![1];
  const stackCollapseSel = `.${stackClass}:where([data-collapse-below="md"])`;
  assertAfter(stackDirection![0], stackCollapseSel);
  assertAfter(`.${stackClass}:where([data-align="center"])`, stackCollapseSel);

  const stackDirectionBody = collapsePlainBlock(stackClass);
  expect(stackDirectionBody).toContain('flex-direction: column');
  expect(stackDirectionBody).not.toContain('align-items');

  const stackStretchGuard = `.${stackClass}:where([data-collapse-below="md"]:not([data-direction="column"]))`;
  expect(css).toContain(stackStretchGuard);
  assertAfter(`.${stackClass}:where([data-align="center"])`, stackStretchGuard);
  expect(css).toMatch(
    new RegExp(
      `${escape(stackStretchGuard)}\\s*\\{[^}]*align-items:\\s*stretch`,
    ),
  );

  // Inline: always direction + stretch together (no data-direction guard).
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
  const inlineCollapseSel = `.${inlineClass}:where([data-collapse-below="md"])`;
  assertAfter(inlineBase![0], inlineCollapseSel);
  assertAfter(
    `.${inlineClass}:where([data-align="center"])`,
    inlineCollapseSel,
  );

  const inlineBody = collapsePlainBlock(inlineClass);
  expect(inlineBody).toContain('flex-direction: column');
  expect(inlineBody).toContain('align-items: stretch');
  expect(css).not.toContain(
    `.${inlineClass}:where([data-collapse-below="md"]:not(`,
  );
});
