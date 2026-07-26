import type { CSSProperties } from 'react';

/**
 * Sparse-criteria for public component CSS variables:
 * - One hook per independently brandable slot (bg / border / fg / radius / …)
 * - Must resolve to a semantic token (or geometry) by default — never a palette step
 * - Prefer a semantic fix over adding a hook when many components need the same concept
 * - Removals, renames, and semantic-meaning changes are breaking (API_POLICY)
 */
export interface SilkComponentVarMeta {
  readonly name: SilkComponentVarName;
  readonly component: string;
  /** Default resolution path (semantic token or geometry the hook falls back to). */
  readonly defaultResolution: string;
  readonly rationale: string;
}

/**
 * Every public component override hook. Literal union source for
 * `SilkComponentVarName`.
 *
 * Kept beside `silkComponentVarMeta` (not derived) because
 * `isolatedDeclarations` cannot emit a const-asserted array that also carries
 * docs metadata; `componentVars.test.ts` asserts the two lists stay identical.
 */
export const silkComponentVarNames = [
  '--silk-avatar-size',
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
  '--silk-empty-state-measure',
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
 * Canonical public component override surface with docs metadata.
 * Theming.mdx table is generated from this list (sync-tested).
 */
export const silkComponentVarMeta: readonly SilkComponentVarMeta[] = [
  {
    name: '--silk-avatar-size',
    component: 'Avatar',
    defaultResolution: 'mediaScale edge (px)',
    rationale: 'Runtime size when not using the size axis',
  },
  {
    name: '--silk-badge-bg',
    component: 'Badge',
    defaultResolution: 'tone solid / subtle by variant',
    rationale: 'Brand fill override',
  },
  {
    name: '--silk-badge-border',
    component: 'Badge',
    defaultResolution: 'tone border',
    rationale: 'Brand border override',
  },
  {
    name: '--silk-badge-fg',
    component: 'Badge',
    defaultResolution: 'tone onSolid / text by variant',
    rationale: 'Brand foreground override',
  },
  {
    name: '--silk-badge-radius',
    component: 'Badge',
    defaultResolution: 'radius.md / full by size',
    rationale: 'Corner radius escape hatch',
  },
  {
    name: '--silk-button-bg',
    component: 'Button',
    defaultResolution: 'tone solid / subtle by variant',
    rationale: 'Brand fill override',
  },
  {
    name: '--silk-button-border',
    component: 'Button',
    defaultResolution: 'tone border',
    rationale: 'Brand border override',
  },
  {
    name: '--silk-button-fg',
    component: 'Button',
    defaultResolution: 'tone onSolid / text by variant',
    rationale: 'Brand foreground override',
  },
  {
    name: '--silk-button-radius',
    component: 'Button',
    defaultResolution: 'radius.md',
    rationale: 'Corner radius escape hatch',
  },
  {
    name: '--silk-card-bg',
    component: 'Card',
    defaultResolution: 'color.surfaceRaised',
    rationale: 'Surface fill override',
  },
  {
    name: '--silk-card-border',
    component: 'Card',
    defaultResolution: 'color.borderSubtle',
    rationale: 'Border override',
  },
  {
    name: '--silk-card-radius',
    component: 'Card',
    defaultResolution: 'radius.lg',
    rationale: 'Corner radius escape hatch',
  },
  {
    name: '--silk-card-shadow',
    component: 'Card',
    defaultResolution: 'shadow.raised when elevated',
    rationale: 'Elevation ink override',
  },
  {
    name: '--silk-empty-state-measure',
    component: 'EmptyState',
    defaultResolution: 'measure.prose',
    rationale: 'Readable measure for empty-state copy',
  },
  {
    name: '--silk-grid-min',
    component: 'Grid',
    defaultResolution: 'minColumnWidth prop / recipe default',
    rationale: 'Runtime track minimum',
  },
  {
    name: '--silk-input-bg',
    component: 'Input/Textarea',
    defaultResolution: 'color.surfaceSunken',
    rationale: 'Control fill override',
  },
  {
    name: '--silk-input-border',
    component: 'Input/Textarea',
    defaultResolution: 'color.borderSubtle',
    rationale: 'Control border override',
  },
  {
    name: '--silk-input-radius',
    component: 'Input/Textarea',
    defaultResolution: 'radius.md',
    rationale: 'Control radius escape hatch',
  },
  {
    name: '--silk-scrollarea-thumb',
    component: 'ScrollArea',
    defaultResolution: 'color.borderSubtle',
    rationale: 'Scrollbar thumb ink',
  },
  {
    name: '--silk-select-bg',
    component: 'Select',
    defaultResolution: 'color.surfaceSunken',
    rationale: 'Trigger fill override',
  },
  {
    name: '--silk-select-border',
    component: 'Select',
    defaultResolution: 'color.borderSubtle',
    rationale: 'Trigger border override',
  },
  {
    name: '--silk-select-radius',
    component: 'Select',
    defaultResolution: 'radius.md',
    rationale: 'Trigger radius escape hatch',
  },
  {
    name: '--silk-status-dot-bg',
    component: 'StatusDot',
    defaultResolution: 'tone solid',
    rationale: 'Status ink override',
  },
  {
    name: '--silk-surface-bg',
    component: 'Surface',
    defaultResolution: 'color.surface / surfaceRaised / surfaceSunken',
    rationale: 'Surface fill override',
  },
  {
    name: '--silk-surface-border',
    component: 'Surface',
    defaultResolution: 'color.borderSubtle',
    rationale: 'Surface border override',
  },
  {
    name: '--silk-surface-radius',
    component: 'Surface',
    defaultResolution: 'radius.md',
    rationale: 'Surface radius escape hatch',
  },
  {
    name: '--silk-surface-shadow',
    component: 'Surface',
    defaultResolution: 'shadow.raised when elevated',
    rationale: 'Elevation ink override',
  },
];

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

/** Markdown table body derived from metadata — used by docs sync tests. */
export function formatComponentVarDocsTable(): string {
  const header =
    '| Variable | Component | Default resolution | Rationale |\n| --- | --- | --- | --- |';
  const rows = silkComponentVarMeta.map(
    (entry) =>
      `| \`${entry.name}\` | ${entry.component} | ${entry.defaultResolution} | ${entry.rationale} |`,
  );
  return [header, ...rows].join('\n');
}
