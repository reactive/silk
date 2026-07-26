/** Shared semantic text colors for Text / Heading. */

export const textToneColor = {
  primary: 'var(--silk-color-text-primary)',
  secondary: 'var(--silk-color-text-secondary)',
  accent: 'var(--silk-color-tone-accent-text)',
  danger: 'var(--silk-color-tone-danger-text)',
  success: 'var(--silk-color-tone-success-text)',
} as const;

export type TextToneName = keyof typeof textToneColor;

export function textToneRulesCss(tones: readonly TextToneName[]): string {
  return tones
    .map((tone) => {
      const color = textToneColor[tone];
      return `
    &:where([data-tone='${tone}']) {
      color: ${color};
    }
  `;
    })
    .join('\n');
}
