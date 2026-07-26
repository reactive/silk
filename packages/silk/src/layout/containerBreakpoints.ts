import {
  containerRecipe,
  type ContainerVariantProps,
} from '@reactive/silk-core';

/**
 * Container-query breakpoints (web-only). Used by `collapseBelow` on Stack/Inline.
 * Distinct from `containerMaxWidths` (Container `size`) — same names, different px.
 * Must not enter core recipes.
 */
export const containerBreakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
} as const;

export type ContainerBreakpoint = keyof typeof containerBreakpoints;

export const containerBreakpointNames: readonly ContainerBreakpoint[] = [
  'xs',
  'sm',
  'md',
  'lg',
];

/** Max-width tokens for the Container component (web-only px values). */
export const containerMaxWidths: Readonly<
  Record<NonNullable<ContainerVariantProps['size']>, number | null>
> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  full: null,
};

export type ContainerSize = keyof typeof containerMaxWidths;
