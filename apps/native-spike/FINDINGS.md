# Native contract spike — findings

Throwaway Expo app (`apps/native-spike`) consuming `@reactive/silk-core` only.
Goal: catch web-shaped assumptions in tokens/recipes while contracts are cheap to change.

## What worked without changes

- **Numeric dimensions** — `space`, `radius`, typography `size`/`weight` are numbers; map cleanly to RN style props (px-equivalent).
- **Unitless `lineHeight`** — documented in core; native multiplies by `size` for absolute RN `lineHeight`. Web keeps the unitless CSS value via `themeToCssVars`.
- **Recipe contracts** — `defineRecipe` variant unions + defaults are renderer-agnostic; this spike resolves them into style objects the same way web resolves them into `data-*` + CSS.
- **Semantic colors / tones** — plain color strings; no palette leakage required.
- **`compactSpace` as a parallel export** — density remapping stays a renderer concern (web: CSS aliases; native: pick scale in mapper). Core does not need RN imports.
- **`createTheme` Theme object** — sufficient native theme delivery via React context (no CSS variables).

## Trivial core fix applied

| Item | Change |
| --- | --- |
| `InteractionToneColors` JSDoc | Said “via semantic CSS variables”; reworded to “via semantic tokens” so the contract reads platform-neutral. |

## Justified divergences (logged, not folded into core)

| Assumption | Web | Native (this spike) | Verdict |
| --- | --- | --- | --- |
| Typography `family` | CSS font-family list (`ui-sans-serif, system-ui, …`) | Take first face or omit → platform default | Keep CSS-oriented default stack in core; native serializer resolves. Optional later: structured `family` / `nativeFamily`. |
| Motion `easing` | CSS `cubic-bezier(...)` strings | Unused by Box/Stack/Text/Button styles here | Leave as string; native motion layer can map or ignore. |
| Theme delivery | CSS vars + `data-theme` / `data-density` | `ThemeProvider` context with `Theme` + `density` | Renderer-only; do not put CSS var names in core. |
| Interaction states | `:hover` / `:focus-visible` / `transition` | `Pressable` pressed + disabled only | Web-only affordances; recipes stay visual (variant/tone/size/density). |
| Layout extras | `asChild`, container queries, `collapseBelow`, `contain` | Omitted | Already web-scoped in `@reactive/silk`. |
| Button layout | `inline-flex` | `alignSelf: 'flex-start'` + row flex | RN has no inline formatting context; acceptable. |
| Box model | `box-sizing: border-box`, `min-width: 0` | RN default box model; no minWidth reset in spike | Document if overflow bugs appear; not a core token issue. |
| Density on Theme | Effective `--silk-space-*` via DOM | Context `density` + `compactSpace` / `theme.semantic.space` | Keep density off the Theme object unless a cross-platform API is designed later. |
| Nested provider inheritance | Omitted `colorScheme`/`density` inherit parent | Spike resets omitted props to defaults | Intentional spike simplification; graduate web-like inheritance in Stage 6. |

## Expo / React notes

- Spike targets **Expo SDK 55** with **React 19.2.0** / RN **0.83.10** (template pins). React 19 is supported.
- No `build` script — root `yarn build` topological foreach skips this workspace.
- Verification path: `yarn workspace @reactive/silk-native-spike test` (Node smoke; no simulator).
- Conceptual run: `yarn workspace @reactive/silk-native-spike start` or `web` (Metro + `react-native-web`).

## Stage 6 takeaway

Graduate mappers + ThemeProvider into `@reactive/silk-native` with the same recipe props; keep CSS var serialization exclusive to `@reactive/silk`.
