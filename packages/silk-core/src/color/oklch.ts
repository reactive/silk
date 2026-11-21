/**
 * Silk's colors are written in OKLCH, where lightness (L) is perceptual: two
 * colors with the same L look equally light whatever their hue, so a light
 * scheme and its dark twin can be paired by L alone. React Native can't parse
 * `oklch()` strings (Android drops them), so `oklch()` returns the color's sRGB
 * serialization, which every renderer reads.
 *
 * Imports nothing, so a web view's bundle can use it on its own
 * (`@reactive/silk-core/color`).
 */

const toGamma = (linear: number): number =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;

const byte = (linear: number): number =>
  Math.round(Math.min(1, Math.max(0, toGamma(linear))) * 255);

/**
 * The sRGB color at OKLCH lightness `l` (0–1), chroma `c` and hue `h` (degrees),
 * as `#rrggbb`, or as `rgba(r, g, b, alpha)` when `alpha` is given. Colors outside
 * sRGB are clipped channel by channel, so write ones inside it.
 */
export function oklch(l: number, c: number, h: number, alpha?: number): string {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  // OKLab to linear sRGB (Björn Ottosson, "A perceptual color space for image processing").
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((x) => x ** 3) as [number, number, number];
  const [L, M, S] = lms;
  const rgb = [
    byte(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    byte(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    byte(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
  if (alpha !== undefined) {
    return `rgba(${rgb.join(', ')}, ${alpha})`;
  }
  return `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
