// The sRGB transfer function and the string forms Silk writes colors in.

/** sRGB channels, each 0–255. */
export type Rgb = readonly [red: number, green: number, blue: number];

/** A 0–255 sRGB channel as linear light. */
export function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** A linear-light channel, gamma-encoded, clipped and scaled to 0–255. */
export function encode(linear: number): number {
  const gamma =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, gamma)) * 255);
}

const hex = (n: number): string => n.toString(16).padStart(2, '0');

/** `#rrggbb`, or `rgba(r, g, b, alpha)` when `alpha` is given. */
export function formatRgb([red, green, blue]: Rgb, alpha?: number): string {
  return alpha === undefined
    ? `#${hex(red)}${hex(green)}${hex(blue)}`
    : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
