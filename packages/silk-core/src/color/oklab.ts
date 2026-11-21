// Conversions between sRGB and OKLab (Björn Ottosson, "A perceptual color
// space for image processing"). Internal: the public edge is oklch().

/** A color in OKLab: lightness 0–1 and the two opponent axes. */
export type Oklab = readonly [l: number, a: number, b: number];

const hex = (n: number): string => n.toString(16).padStart(2, '0');

/** A linear-light sRGB channel, gamma-encoded, clipped and scaled to 0–255. */
const encode = (linear: number): number => {
  const gamma =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, gamma)) * 255);
};

/** A 0–255 sRGB channel as linear light. */
export const linearize = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** OKLab to `#rrggbb`, or `rgba(r, g, b, alpha)`, clipping outside sRGB. */
export function oklabToRgb([l, a, b]: Oklab, alpha?: number): string {
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = encode(
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
  );
  const green = encode(
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
  );
  const blue = encode(
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  );
  return alpha === undefined
    ? `#${hex(red)}${hex(green)}${hex(blue)}`
    : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** 0–255 sRGB channels to OKLab. */
export function rgbToOklab(red: number, green: number, blue: number): Oklab {
  const r = linearize(red);
  const g = linearize(green);
  const b = linearize(blue);
  const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const medium = Math.cbrt(
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
  );
  const short = Math.cbrt(
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  );
  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ];
}
