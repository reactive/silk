import type { Theme } from '@reactive/silk-core';

export type CssVarMap = Readonly<Record<`--silk-${string}`, string>>;

function px(value: number): string {
  return `${value}px`;
}

/**
 * Serialize a canonical Theme into CSS custom properties for the style attribute.
 * Palette values are intentionally not emitted.
 */
export function themeToCssVars(theme: Theme): CssVarMap {
  const { color, space, radius, typography, motion } = theme.semantic;
  const vars: Record<`--silk-${string}`, string> = {
    '--silk-color-surface': color.surface,
    '--silk-color-surface-raised': color.surfaceRaised,
    '--silk-color-text-primary': color.textPrimary,
    '--silk-color-text-secondary': color.textSecondary,
    '--silk-color-border-subtle': color.borderSubtle,
  };

  for (const tone of ['neutral', 'accent', 'danger'] as const) {
    const t = color.tones[tone];
    vars[`--silk-color-tone-${tone}-solid`] = t.solid;
    vars[`--silk-color-tone-${tone}-on-solid`] = t.onSolid;
    vars[`--silk-color-tone-${tone}-subtle`] = t.subtle;
    vars[`--silk-color-tone-${tone}-border`] = t.border;
    vars[`--silk-color-tone-${tone}-hover`] = t.hover;
    vars[`--silk-color-tone-${tone}-active`] = t.active;
    vars[`--silk-color-tone-${tone}-focus-ring`] = t.focusRing;
    vars[`--silk-color-tone-${tone}-disabled-fg`] = t.disabledFg;
    vars[`--silk-color-tone-${tone}-disabled-bg`] = t.disabledBg;
  }

  for (const step of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const) {
    vars[`--silk-space-${step}`] = px(space[step]);
  }

  for (const name of ['none', 'sm', 'md', 'lg', 'full'] as const) {
    vars[`--silk-radius-${name}`] = px(radius[name]);
  }

  for (const role of [
    'body',
    'bodySm',
    'heading',
    'headingLg',
    'label',
    'caption',
  ] as const) {
    const key = role.replace(/([A-Z])/g, '-$1').toLowerCase();
    const typo = typography[role];
    vars[`--silk-typography-${key}-family`] = typo.family;
    vars[`--silk-typography-${key}-size`] = px(typo.size);
    vars[`--silk-typography-${key}-line-height`] = String(typo.lineHeight);
    vars[`--silk-typography-${key}-weight`] = String(typo.weight);
  }

  for (const name of ['fast', 'normal', 'slow'] as const) {
    const m = motion[name];
    vars[`--silk-motion-${name}-duration-ms`] = `${m.durationMs}ms`;
    vars[`--silk-motion-${name}-easing`] = m.easing;
  }

  return vars;
}
