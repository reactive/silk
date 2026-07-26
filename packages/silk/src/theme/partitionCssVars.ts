import type { CssVarMap } from './themeToCssVars';

/**
 * Theme-owned CSS variables — replaced when a nested provider sets `theme` or
 * `colorScheme`. Inherited into portals only from the nearest scope that owns
 * them (custom theme or explicit style semantic overrides).
 */
export function isThemeOwnedVar(name: string): boolean {
  return (
    name.startsWith('--silk-color-') ||
    name.startsWith('--silk-space-comfortable-') ||
    name.startsWith('--silk-space-compact-') ||
    name.startsWith('--silk-radius-') ||
    name.startsWith('--silk-font-') ||
    name.startsWith('--silk-typography-') ||
    name.startsWith('--silk-measure-') ||
    name.startsWith('--silk-motion-') ||
    name.startsWith('--silk-shadow-') ||
    name.startsWith('--silk-focus-')
  );
}

export function partitionCssVars(vars: CssVarMap | undefined): {
  readonly semanticVars: CssVarMap | undefined;
  readonly customVars: CssVarMap | undefined;
} {
  if (!vars) {
    return { semanticVars: undefined, customVars: undefined };
  }
  const semantic: Record<`--silk-${string}`, string> = {};
  const custom: Record<`--silk-${string}`, string> = {};
  let hasSemantic = false;
  let hasCustom = false;
  for (const [key, value] of Object.entries(vars)) {
    if (isThemeOwnedVar(key)) {
      semantic[key as `--silk-${string}`] = value;
      hasSemantic = true;
    } else if (key.startsWith('--silk-')) {
      custom[key as `--silk-${string}`] = value;
      hasCustom = true;
    }
  }
  return {
    semanticVars: hasSemantic ? semantic : undefined,
    customVars: hasCustom ? custom : undefined,
  };
}

export function mergeCssVarMaps(
  ...maps: Array<CssVarMap | undefined>
): CssVarMap | undefined {
  let merged: Record<`--silk-${string}`, string> | undefined;
  for (const map of maps) {
    if (!map) {
      continue;
    }
    merged = merged === undefined ? map : { ...merged, ...map };
  }
  return merged;
}
