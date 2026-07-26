/**
 * Map recipe tone variants onto private `--_tone-*` CSS variables.
 * Build-time Linaria interpolation only.
 */
export function tonePrivateVarsCss(
  tones: readonly string[],
  slots: readonly string[],
): string {
  return tones
    .map(
      (tone) => `
    &:where([data-tone='${tone}']) {
      ${slots
        .map(
          (slot) =>
            `--_tone-${slot}: var(--silk-color-tone-${tone}-${slot});`,
        )
        .join('\n')}
    }
  `,
    )
    .join('\n');
}
