---
"@reactive/silk-core": minor
"@reactive/silk": minor
---

Cowork-inspired font defaults: first-class `sans` / `serif` / `mono` families.

**breaking:**
- `TypographyRecord.family` is now a `FontFamilyName` (`'sans' | 'serif' | 'mono'`) instead of a raw CSS `font-family` stack.
- `SemanticTokens` gains required `fontFamily: Record<FontFamilyName, string>` (CSS stacks). Exhaustive `Record` / merge helpers must include it.
- Default stacks lead with Inter / Source Serif 4 / JetBrains Mono (plus system fallbacks). Only `headingXl` (display / page H1) uses `serif`; section/panel `headingLg` and other roles stay `sans`.
- Web CSS emits `--silk-font-sans`, `--silk-font-serif`, `--silk-font-mono`; role vars are indirect (`--silk-typography-*-family: var(--silk-font-…)`).

Silk still ships no font files — load the faces yourself or fall through to system. Override via `createTheme({ semantic: { fontFamily: { sans: '…' } } })` or the `--silk-font-*` CSS variables.
