/**
 * Shared focus-ring CSS helper. Geometry comes from semantic tokens
 * (`--silk-focus-ring-width` / `--silk-focus-ring-offset`); color is per-tone.
 */
export function focusRingCss(
  ringVar = 'var(--_tone-focus-ring, var(--silk-color-tone-accent-focus-ring))',
): string {
  return `
    outline: var(--silk-focus-ring-width) solid ${ringVar};
    outline-offset: var(--silk-focus-ring-offset);
  `;
}
