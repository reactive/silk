/**
 * Imports nothing, so a web view's bundle can take it alone
 * (`@reactive/silk-core/color`).
 */

/** A linear-light sRGB channel, gamma-encoded, clipped and scaled to 0–255. */
const encode = (linear: number): number => {
  const gamma =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, gamma)) * 255);
};

const hex = (n: number): string => n.toString(16).padStart(2, '0');

/**
 * A color written in OKLCH, whose lightness `l` (0–1) is perceptual: two colors
 * with the same `l` look equally light whatever their chroma `c` and hue `h`
 * (degrees), so a light scheme and its dark twin pair by `l`. Returns the sRGB
 * form, `#rrggbb`, or `rgba(r, g, b, alpha)` when `alpha` is given, because
 * React Native drops `oklch()` strings.
 *
 * Clips each channel of a color outside sRGB, so write colors inside it.
 * (`generateScale` maps its colors into sRGB by lowering chroma instead.)
 */
export function oklch(l: number, c: number, h: number, alpha?: number): string {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  // OKLab to linear sRGB (Björn Ottosson, "A perceptual color space for image processing").
  const lms1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const lms2 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const lms3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = encode(
    4.0767416621 * lms1 - 3.3077115913 * lms2 + 0.2309699292 * lms3,
  );
  const green = encode(
    -1.2684380046 * lms1 + 2.6097574011 * lms2 - 0.3413193965 * lms3,
  );
  const blue = encode(
    -0.0041960863 * lms1 - 0.7034186147 * lms2 + 1.707614701 * lms3,
  );
  return alpha === undefined
    ? `#${hex(red)}${hex(green)}${hex(blue)}`
    : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
