import { toneNames, type Theme } from '../tokens/index.js';
import {
  contrastRatio,
  parseCanonicalHex,
  relativeLuminance,
} from './colorMath.js';

export type ContrastViolation =
  | {
      readonly kind: 'contrast';
      readonly pathFg: string;
      readonly pathBg: string;
      readonly threshold: number;
      readonly actual: number;
      readonly reason: string;
    }
  | {
      readonly kind: 'unsupported-color';
      readonly path: string;
      readonly value: string;
      readonly reason: string;
    }
  | {
      readonly kind: 'distinctness';
      readonly paths: readonly string[];
      readonly reason: string;
    };

export interface ThemeContrastResult {
  readonly ok: boolean;
  readonly violations: readonly ContrastViolation[];
}

/** Minimum relative-luminance delta for “visibly distinct” fills (charter). */
const MIN_LUMINANCE_DELTA = 0.01;

function collectHex(
  violations: ContrastViolation[],
  seenUnsupported: Set<string>,
  path: string,
  value: string,
): string | null {
  const hex = parseCanonicalHex(value);
  if (hex) {
    return hex;
  }
  if (!seenUnsupported.has(path)) {
    seenUnsupported.add(path);
    violations.push({
      kind: 'unsupported-color',
      path,
      value,
      reason: 'Contrast auditing supports sRGB hex (#RGB / #RRGGBB) only',
    });
  }
  return null;
}

function assertContrast(
  violations: ContrastViolation[],
  seenUnsupported: Set<string>,
  pathFg: string,
  fg: string,
  pathBg: string,
  bg: string,
  threshold: number,
  reason: string,
): void {
  const fgHex = collectHex(violations, seenUnsupported, pathFg, fg);
  const bgHex = collectHex(violations, seenUnsupported, pathBg, bg);
  if (!fgHex || !bgHex) {
    return;
  }
  const actual = contrastRatio(fgHex, bgHex);
  if (actual == null) {
    return;
  }
  if (actual < threshold) {
    violations.push({
      kind: 'contrast',
      pathFg,
      pathBg,
      threshold,
      actual,
      reason,
    });
  }
}

function assertDistinct(
  violations: ContrastViolation[],
  seenUnsupported: Set<string>,
  paths: readonly string[],
  values: readonly string[],
  reason: string,
): void {
  const canonical: string[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const hex = collectHex(violations, seenUnsupported, paths[i]!, values[i]!);
    if (hex == null) {
      return;
    }
    canonical.push(hex);
  }
  if (new Set(canonical).size !== canonical.length) {
    violations.push({ kind: 'distinctness', paths, reason });
  }
}

function assertLuminanceSeparation(
  violations: ContrastViolation[],
  seenUnsupported: Set<string>,
  pathA: string,
  a: string,
  pathB: string,
  b: string,
  reason: string,
): void {
  const hexA = collectHex(violations, seenUnsupported, pathA, a);
  const hexB = collectHex(violations, seenUnsupported, pathB, b);
  if (!hexA || !hexB) {
    return;
  }
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  if (lA == null || lB == null) {
    return;
  }
  if (Math.abs(lA - lB) < MIN_LUMINANCE_DELTA) {
    violations.push({
      kind: 'distinctness',
      paths: [pathA, pathB],
      reason,
    });
  }
}

/**
 * Audit a theme against Silk's contrast and state-distinguishability contract.
 *
 * Hex-only: non-hex semantic colors produce `unsupported-color` diagnostics
 * (they are not treated as passing). Overlay/rgba scrims are skipped.
 */
export function checkThemeContrast(theme: Theme): ThemeContrastResult {
  const violations: ContrastViolation[] = [];
  const seenUnsupported = new Set<string>();
  const { color } = theme.semantic;

  const surfaces = [
    ['color.surface', color.surface],
    ['color.surfaceRaised', color.surfaceRaised],
    ['color.surfaceSunken', color.surfaceSunken],
  ] as const;

  // Validate core semantic colors once (overlay excluded — may include alpha).
  for (const [path, value] of [
    ...surfaces,
    ['color.textPrimary', color.textPrimary],
    ['color.textSecondary', color.textSecondary],
    ['color.borderSubtle', color.borderSubtle],
  ] as const) {
    collectHex(violations, seenUnsupported, path, value);
  }

  for (const [path, surface] of surfaces) {
    assertContrast(
      violations,
      seenUnsupported,
      'color.textPrimary',
      color.textPrimary,
      path,
      surface,
      4.5,
      'Primary text on surface must meet WCAG AA 4.5:1',
    );
    assertContrast(
      violations,
      seenUnsupported,
      'color.textSecondary',
      color.textSecondary,
      path,
      surface,
      4.5,
      'Secondary text on surface must meet WCAG AA 4.5:1',
    );
  }

  assertDistinct(
    violations,
    seenUnsupported,
    ['color.surface', 'color.surfaceRaised'],
    [color.surface, color.surfaceRaised],
    'Raised surface must differ from flat surface',
  );
  assertDistinct(
    violations,
    seenUnsupported,
    ['color.surface', 'color.surfaceSunken'],
    [color.surface, color.surfaceSunken],
    'Sunken surface must differ from flat surface',
  );
  assertDistinct(
    violations,
    seenUnsupported,
    ['color.textPrimary', 'color.textSecondary'],
    [color.textPrimary, color.textSecondary],
    'Primary and secondary text must differ',
  );

  for (const tone of toneNames) {
    const t = color.tones[tone];
    const base = `color.tones.${tone}`;

    for (const [slot, value] of [
      ['solid', t.solid],
      ['onSolid', t.onSolid],
      ['text', t.text],
      ['subtle', t.subtle],
      ['subtleHover', t.subtleHover],
      ['subtleActive', t.subtleActive],
      ['border', t.border],
      ['hover', t.hover],
      ['active', t.active],
      ['focusRing', t.focusRing],
      ['disabledFg', t.disabledFg],
      ['disabledBg', t.disabledBg],
    ] as const) {
      collectHex(violations, seenUnsupported, `${base}.${slot}`, value);
    }

    assertContrast(
      violations,
      seenUnsupported,
      `${base}.onSolid`,
      t.onSolid,
      `${base}.solid`,
      t.solid,
      4.5,
      'onSolid on solid must meet WCAG AA 4.5:1',
    );

    for (const [slot, fill] of [
      ['subtle', t.subtle],
      ['subtleHover', t.subtleHover],
      ['subtleActive', t.subtleActive],
    ] as const) {
      assertContrast(
        violations,
        seenUnsupported,
        `${base}.text`,
        t.text,
        `${base}.${slot}`,
        fill,
        4.5,
        'Tone text on subtle fills must meet WCAG AA 4.5:1',
      );
    }

    const toneTextSurfaces =
      tone === 'neutral'
        ? ([['color.surface', color.surface]] as const)
        : ([
            ['color.surface', color.surface],
            ['color.surfaceRaised', color.surfaceRaised],
          ] as const);
    for (const [path, surface] of toneTextSurfaces) {
      assertContrast(
        violations,
        seenUnsupported,
        `${base}.text`,
        t.text,
        path,
        surface,
        4.5,
        tone === 'neutral'
          ? 'Tone text on page surface must meet WCAG AA 4.5:1'
          : 'Chromatic tone text on raised/flat surfaces must meet WCAG AA 4.5:1',
      );
    }

    for (const [path, surface] of surfaces) {
      assertContrast(
        violations,
        seenUnsupported,
        `${base}.focusRing`,
        t.focusRing,
        path,
        surface,
        3,
        'Focus ring must meet WCAG 1.4.11 non-text contrast 3:1',
      );
    }

    for (const [slot, fill] of [
      ['hover', t.hover],
      ['active', t.active],
    ] as const) {
      assertContrast(
        violations,
        seenUnsupported,
        `${base}.onSolid`,
        t.onSolid,
        `${base}.${slot}`,
        fill,
        4.5,
        'onSolid must stay readable on hover/active fills',
      );
    }

    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.solid`, `${base}.hover`, `${base}.active`],
      [t.solid, t.hover, t.active],
      'solid/hover/active must be three distinct fills',
    );
    assertLuminanceSeparation(
      violations,
      seenUnsupported,
      `${base}.solid`,
      t.solid,
      `${base}.hover`,
      t.hover,
      'solid and hover must be perceptually separated',
    );
    assertLuminanceSeparation(
      violations,
      seenUnsupported,
      `${base}.hover`,
      t.hover,
      `${base}.active`,
      t.active,
      'hover and active must be perceptually separated',
    );
    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.subtle`, `${base}.subtleHover`],
      [t.subtle, t.subtleHover],
      'subtleHover must differ from subtle',
    );
    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.subtleHover`, `${base}.subtleActive`],
      [t.subtleHover, t.subtleActive],
      'subtleActive must differ from subtleHover',
    );
    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.disabledBg`, `${base}.solid`],
      [t.disabledBg, t.solid],
      'disabledBg must differ from solid',
    );
    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.disabledFg`, `${base}.onSolid`],
      [t.disabledFg, t.onSolid],
      'disabledFg must differ from onSolid',
    );
    assertDistinct(
      violations,
      seenUnsupported,
      [`${base}.disabledFg`, `${base}.disabledBg`],
      [t.disabledFg, t.disabledBg],
      'disabledFg must differ from disabledBg',
    );
  }

  return { ok: violations.length === 0, violations };
}
