import {
  compactSpace,
  motionNames,
  spaceSteps,
  toneNames,
  type ShadowLayer,
  type Theme,
} from '@reactive/silk-core';
import { typographyRoles, typographyRoleVarKey } from './typographyCss';

export type CssVarMap = Readonly<Record<`--silk-${string}`, string>>;

function px(value: number): string {
  return `${value}px`;
}

/**
 * Serialize a shadow layer to a CSS box-shadow value.
 * Ink is black modulated by opacity — dark schemes rely on surface + border.
 */
function shadowLayerToCss(layer: ShadowLayer): string {
  const alpha = Math.min(1, Math.max(0, layer.opacity));
  return `${px(layer.offsetX)} ${px(layer.offsetY)} ${px(layer.blur)} ${px(layer.spread)} rgba(0, 0, 0, ${alpha})`;
}

const themeCssVarsCache = new WeakMap<Theme, CssVarMap>();

/**
 * Serialize a canonical Theme into CSS custom properties for the style attribute.
 * Palette values are intentionally not emitted.
 *
 * Space tokens emit source scales only (`--silk-space-comfortable-*`,
 * `--silk-space-compact-*`). Effective `--silk-space-*` aliases are owned by
 * `densityClass` so density remaps are not overridden by theme/inline styles.
 */
export function themeToCssVars(theme: Theme): CssVarMap {
  const cached = themeCssVarsCache.get(theme);
  if (cached) {
    return cached;
  }

  const vars = buildThemeCssVars(theme);
  themeCssVarsCache.set(theme, vars);
  return vars;
}

function buildThemeCssVars(theme: Theme): CssVarMap {
  const { color, space, radius, typography, motion, shadow, focusRing } =
    theme.semantic;
  const vars: Record<`--silk-${string}`, string> = {
    '--silk-color-surface': color.surface,
    '--silk-color-surface-raised': color.surfaceRaised,
    '--silk-color-surface-sunken': color.surfaceSunken,
    '--silk-color-text-primary': color.textPrimary,
    '--silk-color-text-secondary': color.textSecondary,
    '--silk-color-border-subtle': color.borderSubtle,
    '--silk-color-overlay': color.overlay,
  };

  for (const tone of toneNames) {
    const t = color.tones[tone];
    vars[`--silk-color-tone-${tone}-solid`] = t.solid;
    vars[`--silk-color-tone-${tone}-on-solid`] = t.onSolid;
    vars[`--silk-color-tone-${tone}-text`] = t.text;
    vars[`--silk-color-tone-${tone}-subtle`] = t.subtle;
    vars[`--silk-color-tone-${tone}-subtle-hover`] = t.subtleHover;
    vars[`--silk-color-tone-${tone}-subtle-active`] = t.subtleActive;
    vars[`--silk-color-tone-${tone}-border`] = t.border;
    vars[`--silk-color-tone-${tone}-hover`] = t.hover;
    vars[`--silk-color-tone-${tone}-active`] = t.active;
    vars[`--silk-color-tone-${tone}-focus-ring`] = t.focusRing;
    vars[`--silk-color-tone-${tone}-disabled-fg`] = t.disabledFg;
    vars[`--silk-color-tone-${tone}-disabled-bg`] = t.disabledBg;
  }

  for (const step of spaceSteps) {
    vars[`--silk-space-comfortable-${step}`] = px(space[step]);
    vars[`--silk-space-compact-${step}`] = px(compactSpace[step]);
  }

  for (const name of ['none', 'sm', 'md', 'lg', 'full'] as const) {
    vars[`--silk-radius-${name}`] = px(radius[name]);
  }

  for (const role of typographyRoles) {
    const key = typographyRoleVarKey[role];
    const typo = typography[role];
    vars[`--silk-typography-${key}-family`] = typo.family;
    vars[`--silk-typography-${key}-size`] = px(typo.size);
    vars[`--silk-typography-${key}-line-height`] = String(typo.lineHeight);
    vars[`--silk-typography-${key}-weight`] = String(typo.weight);
  }

  for (const name of motionNames) {
    const m = motion[name];
    vars[`--silk-motion-${name}-duration-ms`] = `${m.durationMs}ms`;
    vars[`--silk-motion-${name}-easing`] = m.easing;
  }

  for (const name of ['raised', 'overlay'] as const) {
    vars[`--silk-shadow-${name}`] = shadowLayerToCss(shadow[name]);
  }

  vars['--silk-focus-ring-width'] = px(focusRing.width);
  vars['--silk-focus-ring-offset'] = px(focusRing.offset);

  return vars;
}
