import type { Theme, ToneName } from '@reactive/silk-core';
import type { RnViewStyle } from './shared.js';

/**
 * The keyboard focus ring: the tone's `focusRing` color at the theme's
 * `semantic.focusRing` width and offset, drawn as an outline so it never
 * changes layout (web parity with `focusRingCss`). `zIndex` lifts the focused
 * control so later siblings don't paint over the part of the ring outside it.
 */
export function mapFocusRingStyle(
  theme: Theme,
  tone: ToneName = 'accent',
): RnViewStyle {
  const { width, offset } = theme.semantic.focusRing;
  return {
    outlineWidth: width,
    outlineStyle: 'solid',
    outlineColor: theme.semantic.color.tones[tone].focusRing,
    outlineOffset: offset,
    zIndex: 1,
  };
}
