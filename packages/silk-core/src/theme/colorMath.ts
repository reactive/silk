/**
 * sRGB hex contrast utilities (WCAG 2.x relative luminance).
 * Platform-neutral; hex-only — other CSS color syntaxes return null.
 */

/** Normalize `#RGB` / `#RRGGBB` to lowercase `#rrggbb`, or null. */
export function parseCanonicalHex(color: string): string | null {
  const hex = color.trim();
  if (!hex.startsWith('#')) {
    return null;
  }
  if (hex.length === 4 && /^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  if (hex.length === 7 && /^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toLowerCase();
  }
  return null;
}

export function parseHexChannels(
  color: string,
): [number, number, number] | null {
  const hex = parseCanonicalHex(color);
  if (!hex) {
    return null;
  }
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const luminanceCache = new Map<string, number>();

/** WCAG relative luminance, or null when `color` is not a parseable hex. */
export function relativeLuminance(color: string): number | null {
  const hex = parseCanonicalHex(color);
  if (!hex) {
    return null;
  }
  const cached = luminanceCache.get(hex);
  if (cached !== undefined) {
    return cached;
  }
  const rgb = parseHexChannels(hex);
  if (!rgb) {
    return null;
  }
  const [r, g, b] = rgb;
  const value =
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  luminanceCache.set(hex, value);
  return value;
}

/**
 * WCAG contrast ratio for two sRGB hex colors.
 * Returns null when either value is not a parseable hex (callers should emit
 * `unsupported-color` rather than treating the pair as passing).
 */
export function contrastRatio(
  foreground: string,
  background: string,
): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 == null || l2 == null) {
    return null;
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Assert `#RRGGBB` (any case); returns canonical lowercase hex or throws. */
export function requireCanonicalHex(seed: string, label = 'color'): string {
  const hex = parseCanonicalHex(seed);
  if (!hex) {
    throw new Error(
      `Invalid ${label}: expected #RGB or #RRGGBB sRGB hex, got ${JSON.stringify(seed)}`,
    );
  }
  return hex;
}

/** Assert a finite number ≥ 0 (chroma caps, etc.). */
export function requireFiniteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Invalid ${label}: expected finite number >= 0, got ${String(value)}`,
    );
  }
  return value;
}
