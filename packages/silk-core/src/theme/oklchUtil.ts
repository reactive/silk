import { clampChroma, formatHex, oklch, type Oklch } from 'culori';
import { contrastRatio, relativeLuminance } from './colorMath.js';

export function oklchAt(l: number, c: number, h: number): Oklch {
  return { mode: 'oklch', l, c, h };
}

export function oklchToHex(color: Oklch): string {
  const hex = formatHex(clampChroma(color, 'oklch'));
  if (!hex) {
    throw new Error('Failed to serialize OKLCH color to hex');
  }
  return hex.toLowerCase();
}

export function oklchChannelsToHex(l: number, c: number, h: number): string {
  return oklchToHex(oklchAt(l, c, h));
}

/**
 * Walk lightness until contrast vs `against` clears `threshold`.
 * Caches the against-side luminance so each step only measures the candidate.
 */
export function nudgeLUntil(
  hex: string,
  against: string,
  threshold: number,
  options: {
    readonly direction: 1 | -1;
    readonly minL?: number;
    readonly maxL?: number;
    readonly delta?: number;
    readonly maxIters?: number;
  },
): string {
  let current = oklch(hex);
  if (!current) {
    return hex;
  }
  const againstL = relativeLuminance(against);
  const delta = options.delta ?? 0.015;
  const minL = options.minL ?? 0.15;
  const maxL = options.maxL ?? 0.92;
  const maxIters = options.maxIters ?? 40;

  for (let i = 0; i < maxIters; i += 1) {
    const candidate = oklchToHex(current);
    const candidateL = relativeLuminance(candidate);
    if (candidateL != null && againstL != null) {
      const lighter = Math.max(candidateL, againstL);
      const darker = Math.min(candidateL, againstL);
      if ((lighter + 0.05) / (darker + 0.05) >= threshold) {
        return candidate;
      }
    } else {
      const ratio = contrastRatio(candidate, against);
      if (ratio != null && ratio >= threshold) {
        return candidate;
      }
    }
    current = oklchAt(
      Math.min(maxL, Math.max(minL, (current.l ?? 0.5) + options.direction * delta)),
      current.c ?? 0,
      current.h ?? 0,
    );
  }
  return oklchToHex(current);
}
