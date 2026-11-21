import type { JSX } from 'react';
import { View } from 'react-native';

/** A check drawn with borders, not a font's ✓, so its weight and size hold on every platform. */
export function CheckGlyph({ color, size }: { color: string; size: number }): JSX.Element {
  // A rotated L: its arms and stroke are fractions of the box it sits in.
  const thickness = Math.max(2, size * 0.12);
  return (
    <View
      style={{
        width: size * 0.55,
        height: size * 0.35,
        borderBottomWidth: thickness,
        borderLeftWidth: thickness,
        borderColor: color,
        transform: [{ rotate: '-45deg' }, { translateY: -size * 0.05 }],
      }}
    />
  );
}
