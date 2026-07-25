/**
 * Semantic token roles consumed by components.
 * Components must never reference raw palette colors directly.
 */
export interface SemanticTokens {
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly borderSubtle: string;
  readonly accent: string;
  readonly accentHover: string;
  readonly danger: string;
  readonly radius: string;
  readonly spacing: string;
}

/**
 * Raw palette — mapped into semantic tokens by themes.
 */
export interface Palette {
  readonly blue: string;
  readonly gray: string;
  readonly green: string;
  readonly red: string;
}

export interface Theme {
  readonly palette: Palette;
  readonly semantic: SemanticTokens;
}
