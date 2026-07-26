/** Shared elevation fill + shadow for Surface / Card. */

export const elevationTokens = {
  sunken: {
    bg: 'var(--silk-color-surface-sunken)',
    shadow: 'none',
  },
  flat: {
    bg: 'var(--silk-color-surface)',
    shadow: 'none',
  },
  raised: {
    bg: 'var(--silk-color-surface-raised)',
    shadow: 'var(--silk-shadow-raised)',
  },
  overlay: {
    bg: 'var(--silk-color-surface-raised)',
    shadow: 'var(--silk-shadow-overlay)',
  },
} as const;

export type ElevationTokenName = keyof typeof elevationTokens;

/**
 * Build `data-elevation` CSS rules with public override hooks
 * (`--silk-{prefix}-bg|shadow`).
 */
export function elevationRulesCss(
  elevations: readonly ElevationTokenName[],
  prefix: 'surface' | 'card',
): string {
  return elevations
    .map((elevation) => {
      const { bg, shadow } = elevationTokens[elevation];
      return `
    &:where([data-elevation='${elevation}']) {
      background-color: var(--silk-${prefix}-bg, ${bg});
      box-shadow: var(--silk-${prefix}-shadow, ${shadow});
    }
  `;
    })
    .join('\n');
}
