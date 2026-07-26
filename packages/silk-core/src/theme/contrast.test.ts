import { expect, test } from '@rstest/core';
import { toneNames } from '../tokens/index.js';
import { createTheme } from './createTheme.js';

/** sRGB channel → linear. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim();
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return null;
  }
  if (hex.length === 4) {
    const r = Number.parseInt(hex[1]! + hex[1]!, 16);
    const g = Number.parseInt(hex[2]! + hex[2]!, 16);
    const b = Number.parseInt(hex[3]! + hex[3]!, 16);
    return [r, g, b];
  }
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) {
    return null;
  }
  const [r, g, b] = rgb;
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 == null || l2 == null) {
    throw new Error(`Non-hex color pair: ${foreground} / ${background}`);
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const tones = toneNames;

for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme}: text on surfaces meets 4.5:1`, () => {
    const theme = createTheme({ colorScheme: scheme });
    const { color } = theme.semantic;
    for (const surface of [
      color.surface,
      color.surfaceRaised,
      color.surfaceSunken,
    ]) {
      expect(contrastRatio(color.textPrimary, surface)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrastRatio(color.textSecondary, surface),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test(`${scheme}: onSolid/solid meets 4.5:1 for all tones`, () => {
    const theme = createTheme({ colorScheme: scheme });
    for (const tone of tones) {
      const t = theme.semantic.color.tones[tone];
      expect(contrastRatio(t.onSolid, t.solid)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test(`${scheme}: soft/outline/ghost FG (tone text) on subtle fills meets 4.5:1`, () => {
    const theme = createTheme({ colorScheme: scheme });
    for (const tone of tones) {
      const t = theme.semantic.color.tones[tone];
      for (const bg of [t.subtle, t.subtleHover, t.subtleActive]) {
        expect(contrastRatio(t.text, bg)).toBeGreaterThanOrEqual(4.5);
      }
      // Transparent outline/ghost rests on page surface.
      expect(
        contrastRatio(t.text, theme.semantic.color.surface),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test(`${scheme}: tone text on raised/flat surfaces meets 4.5:1`, () => {
    const theme = createTheme({ colorScheme: scheme });
    const { color } = theme.semantic;
    for (const surface of [color.surface, color.surfaceRaised]) {
      for (const tone of ['accent', 'danger', 'success'] as const) {
        expect(
          contrastRatio(color.tones[tone].text, surface),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test(`${scheme}: focus ring ≥3:1 on all surfaces`, () => {
    const theme = createTheme({ colorScheme: scheme });
    const { color } = theme.semantic;
    for (const tone of tones) {
      for (const surface of [
        color.surface,
        color.surfaceRaised,
        color.surfaceSunken,
      ]) {
        expect(
          contrastRatio(color.tones[tone].focusRing, surface),
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test(`${scheme}: disabled pair is distinguishable from enabled solid/onSolid`, () => {
    const theme = createTheme({ colorScheme: scheme });
    for (const tone of tones) {
      const t = theme.semantic.color.tones[tone];
      expect(t.disabledBg).not.toBe(t.solid);
      expect(t.disabledFg).not.toBe(t.onSolid);
      expect(t.disabledFg).not.toBe(t.disabledBg);
      expect(t.subtleHover).not.toBe(t.subtle);
      expect(t.subtleActive).not.toBe(t.subtleHover);
    }
  });

  test(`${scheme}: solid/hover/active are three distinct fills`, () => {
    const theme = createTheme({ colorScheme: scheme });
    for (const tone of tones) {
      const t = theme.semantic.color.tones[tone];
      expect(new Set([t.solid, t.hover, t.active]).size).toBe(3);
    }
  });

  test(`${scheme}: onSolid stays readable on hover and active fills`, () => {
    const theme = createTheme({ colorScheme: scheme });
    for (const tone of tones) {
      const t = theme.semantic.color.tones[tone];
      for (const fill of [t.hover, t.active]) {
        expect(contrastRatio(t.onSolid, fill)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test(`${scheme}: raised surface differs from flat surface`, () => {
    const theme = createTheme({ colorScheme: scheme });
    const { color } = theme.semantic;
    expect(color.surfaceRaised).not.toBe(color.surface);
  });
}
