import type { CSSProperties } from 'react';

/**
 * Every public component override hook, in the form components consume them:
 * `var(--silk-{component}-{slot}, <semantic fallback>)`.
 *
 * Component tokens stay sparse on purpose — they are an override surface, not a
 * parallel token system. `componentVars.test.ts` asserts this list and the
 * extracted stylesheet agree in both directions, so a hook cannot be added,
 * renamed, or dropped without the list following.
 */
export const silkComponentVarNames = [
  '--silk-badge-bg',
  '--silk-badge-border',
  '--silk-badge-fg',
  '--silk-badge-radius',
  '--silk-button-bg',
  '--silk-button-border',
  '--silk-button-fg',
  '--silk-button-radius',
  '--silk-card-bg',
  '--silk-card-border',
  '--silk-card-radius',
  '--silk-card-shadow',
  '--silk-grid-min',
  '--silk-input-bg',
  '--silk-input-border',
  '--silk-input-radius',
  '--silk-scrollarea-thumb',
  '--silk-select-bg',
  '--silk-select-border',
  '--silk-select-radius',
  '--silk-status-dot-bg',
  '--silk-surface-bg',
  '--silk-surface-border',
  '--silk-surface-radius',
  '--silk-surface-shadow',
] as const;

export type SilkComponentVarName = (typeof silkComponentVarNames)[number];

/**
 * `| undefined` is deliberate under `exactOptionalPropertyTypes`: without it a
 * conditional value (`cond ? color : undefined`) would not typecheck.
 */
export type SilkComponentVars = Partial<
  Record<SilkComponentVarName, string | undefined>
>;

/**
 * Type public component hooks for a `style` prop.
 *
 * React's `CSSProperties` cannot express custom properties, so setting hooks
 * inline otherwise needs an `as CSSProperties` cast — which also silences
 * misspelled variable names.
 *
 * Reach for this only when the value is known at runtime (tenant branding, a
 * computed dimension). Static overrides belong in a Linaria `css` class passed
 * through `className`, where they cost nothing per render and can carry
 * pseudo-classes, media queries, and `data-*` state selectors.
 */
export function cssVars(vars: SilkComponentVars): CSSProperties {
  return vars as CSSProperties;
}
