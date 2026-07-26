import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
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
  statusDotRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { containerBreakpointNames } from '../layout/containerBreakpoints';
import { loadDistCss as loadCss } from '../test/distCss';
import { floatingZIndex } from './floatingSurface';

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
  assertAxisSelectors(css, 'data-gap', stackRecipe.variants.gap);
  assertAxisSelectors(css, 'data-align', stackRecipe.variants.align);
  assertAxisSelectors(css, 'data-justify', stackRecipe.variants.justify);
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
  assertAxisSelectors(css, 'data-direction', inlineRecipe.variants.direction);
  assertAxisSelectors(css, 'data-rail', stackRecipe.variants.rail);
  assertAxisSelectors(css, 'data-columns', gridRecipe.variants.columns);
  assertAxisSelectors(css, 'data-align', gridRecipe.variants.align);
  assertAxisSelectors(css, 'data-justify', gridRecipe.variants.justify);
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
  assertAxisSelectors(css, 'data-interactive', surfaceRecipe.variants.interactive);
  assertAxisSelectors(css, 'data-elevation', cardRecipe.variants.elevation);
  assertAxisSelectors(css, 'data-padding', cardRecipe.variants.padding);
  assertAxisSelectors(css, 'data-interactive', cardRecipe.variants.interactive);
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

test('recipe conformance: Stage 4 status indicator axes', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-tone', statusDotRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', statusDotRecipe.variants.size);
  expect(css).toContain('--silk-status-dot-bg');
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

test('portaled surfaces share one stacking scale with Dialog below them', () => {
  const css = loadCss();
  const rules = css.match(/[^{}]*\{[^{}]*\}/g) ?? [];

  // Anchor each value to the rule that owns it: matching on the number alone
  // would still pass if the overlay and panel values were swapped.
  function ruleContaining(needle: string): string {
    const matched = rules.filter((rule) => rule.includes(needle));
    expect(matched).toHaveLength(1);
    return matched[0]!;
  }

  expect(ruleContaining('inset: 0')).toContain(
    `z-index: ${floatingZIndex.dialogOverlay}`,
  );
  expect(
    ruleContaining('max-height: calc(100vh - var(--silk-space-8))'),
  ).toContain(`z-index: ${floatingZIndex.dialog}`);

  for (const value of Object.values(floatingZIndex)) {
    expect(css).toMatch(new RegExp(`z-index: ${value}\\b`));
  }

  // Overlays opened inside a dialog portal out as siblings of the panel, so
  // renumbering Dialog above the anchored surfaces would hide them behind it.
  const { dialogOverlay, dialog, ...anchored } = floatingZIndex;
  expect(dialogOverlay).toBeLessThan(dialog);
  expect(Math.min(...Object.values(anchored))).toBeGreaterThan(dialog);
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

const escapeRe = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * `data-rail` is Stack-only and `data-align="baseline"` is Inline-only, so both
 * survive Grid gaining `data-justify`. Value axes shared across three
 * components (`data-gap`, `data-align`, `data-justify`) cannot identify a class.
 */
function layoutClass(css: string, uniqueSelector: string): string {
  const match = css.match(
    new RegExp(`\\.([a-zA-Z0-9_-]+):where\\(${escapeRe(uniqueSelector)}\\)`),
  );
  expect(match).not.toBeNull();
  return match![1];
}

/** Balanced-brace slice of every `@container` at-rule body. */
function containerBlocks(css: string): readonly string[] {
  const blocks: string[] = [];
  const opener = /@container[^{]*\{/g;
  let match: RegExpExecArray | null = opener.exec(css);
  while (match !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') depth -= 1;
      i += 1;
    }
    blocks.push(css.slice(match.index, i));
    opener.lastIndex = i;
    match = opener.exec(css);
  }
  return blocks;
}

/**
 * Stack is vertical by construction: the axis lives in the base rule, and no
 * variant or container query may reintroduce a direction/wrap flip.
 */
test('Stack CSS is column-only with no direction, wrap, or container rules', () => {
  const css = loadCss();
  const stackClass = layoutClass(css, '[data-rail="start"]');

  expect(css).toMatch(
    new RegExp(`\\.${escapeRe(stackClass)}\\s*\\{[^}]*flex-direction:\\s*column`),
  );
  expect(css).toMatch(
    new RegExp(
      `\\.${escapeRe(stackClass)}:where\\(\\[data-justify="center"\\]\\)\\s*\\{[^}]*justify-content:\\s*center`,
    ),
  );

  for (const attr of ['data-direction', 'data-wrap', 'data-collapse-below']) {
    expect(css).not.toContain(`.${stackClass}:where([${attr}=`);
  }
  for (const block of containerBlocks(css)) {
    expect(block).not.toContain(`.${stackClass}`);
  }
});

test('Grid justify maps to justify-items, not justify-content', () => {
  const css = loadCss();
  const gridColumns = css.match(
    /\.([a-zA-Z0-9_-]+):where\(\[data-columns="auto"\]\)/,
  );
  expect(gridColumns).not.toBeNull();
  const gridClass = gridColumns![1];

  for (const value of gridRecipe.variants.justify) {
    expect(css).toMatch(
      new RegExp(
        `\\.${escapeRe(gridClass)}:where\\(\\[data-justify="${value}"\\]\\)\\s*\\{[^}]*justify-items:\\s*${value}`,
      ),
    );
  }
  expect(css).not.toContain(
    `.${gridClass}:where([data-justify="stretch"]) { justify-content`,
  );
});

/**
 * collapseBelow must share Inline's Linaria class and appear after the base
 * direction and the align rules so equal-specificity source order wins.
 */
test('collapseBelow rules follow Inline base direction and align in CSS', () => {
  const css = loadCss();
  const inlineClass = layoutClass(css, '[data-align="baseline"]');

  function assertAfter(earlierNeedle: string, laterNeedle: string): void {
    const earlierIdx = css.indexOf(earlierNeedle);
    const laterIdx = css.indexOf(laterNeedle);
    expect(earlierIdx).toBeGreaterThan(-1);
    expect(laterIdx).toBeGreaterThan(earlierIdx);
  }

  const inlineBase = css.match(
    new RegExp(`\\.${escapeRe(inlineClass)}\\s*\\{[^}]*flex-direction:\\s*row`),
  );
  expect(inlineBase).not.toBeNull();
  const inlineCollapseSel = `.${inlineClass}:where([data-collapse-below="md"])`;
  assertAfter(inlineBase![0], inlineCollapseSel);
  assertAfter(
    `.${inlineClass}:where([data-align="center"])`,
    inlineCollapseSel,
  );

  const bodyMatch = css.match(
    new RegExp(`${escapeRe(inlineCollapseSel)}\\s*\\{([^}]+)\\}`),
  );
  expect(bodyMatch).not.toBeNull();
  const inlineBody = bodyMatch![1];
  expect(inlineBody).toContain('flex-direction: column');
  expect(inlineBody).toContain('align-items: stretch');
  // Collapsing does not neutralize the axis flip: `justify` still drives
  // `justify-content`, which is the vertical axis once collapsed.
  expect(inlineBody).not.toContain('justify-content');
  expect(css).not.toContain(
    `.${inlineClass}:where([data-collapse-below="md"]:not(`,
  );
});
