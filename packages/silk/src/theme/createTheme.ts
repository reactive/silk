import type { Palette, SemanticTokens, Theme } from './tokens';

export interface CreateThemeOptions {
  readonly palette?: Partial<Palette>;
  readonly semantic?: Partial<SemanticTokens>;
}

const defaultPalette: Palette = {
  blue: '#2563eb',
  gray: '#6b7280',
  green: '#16a34a',
  red: '#dc2626',
};

function createDefaultSemantic(palette: Palette): SemanticTokens {
  return {
    surface: '#ffffff',
    surfaceRaised: '#f9fafb',
    textPrimary: '#111827',
    textSecondary: palette.gray,
    borderSubtle: '#e5e7eb',
    accent: palette.blue,
    accentHover: '#1d4ed8',
    danger: palette.red,
    radius: '0.5rem',
    spacing: '0.5rem',
  };
}

/**
 * Create a theme by mapping a palette into semantic tokens.
 * Placeholder API — will grow into CSS variable emission + nested themes.
 */
export function createTheme(options: CreateThemeOptions = {}): Theme {
  const palette: Palette = {
    ...defaultPalette,
    ...options.palette,
  };

  const semantic: SemanticTokens = {
    ...createDefaultSemantic(palette),
    ...options.semantic,
  };

  return { palette, semantic };
}
