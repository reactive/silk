import { css } from '@linaria/core';
import { spaceSteps } from '@reactive/silk-core';

function spaceAliases(density: 'comfortable' | 'compact'): string {
  return spaceSteps
    .map(
      (step) =>
        `--silk-space-${step}: var(--silk-space-${density}-${step});`,
    )
    .join('\n  ');
}

/**
 * Apply on theme scope roots and any element that sets `data-density`.
 *
 * Themes emit only source scales (`--silk-space-comfortable-*` /
 * `--silk-space-compact-*`). Effective `--silk-space-*` aliases live here so
 * density remaps are never overridden by later equal-specificity theme rules
 * or by inline custom-theme styles.
 *
 * Base aliases = comfortable; compact (and explicit comfortable) override via
 * `data-density` for local Button-style remaps inside a dense subtree.
 */
export const densityClass: string = css`
  ${spaceAliases('comfortable')}

  &:where([data-density='compact']) {
    ${spaceAliases('compact')}
  }

  &:where([data-density='comfortable']) {
    ${spaceAliases('comfortable')}
  }
`;
