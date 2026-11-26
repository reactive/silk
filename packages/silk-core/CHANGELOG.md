# @reactive/silk-core

## 0.1.0

### Minor Changes

- b4fd11a: Cowork-inspired font defaults: first-class `sans` / `serif` / `mono` families.

  **breaking:**

  - `TypographyRecord.family` is now a `FontFamilyName` (`'sans' | 'serif' | 'mono'`) instead of a raw CSS `font-family` stack.
  - `SemanticTokens` gains required `fontFamily: Record<FontFamilyName, string>` (CSS stacks). Exhaustive `Record` / merge helpers must include it.
  - Default stacks lead with Inter / Source Serif 4 / JetBrains Mono (plus system fallbacks). Only `headingXl` (display / page H1) uses `serif`; section/panel `headingLg` and other roles stay `sans`.
  - Web CSS emits `--silk-font-sans`, `--silk-font-serif`, `--silk-font-mono`; role vars are indirect (`--silk-typography-*-family: var(--silk-font-…)`).

  Silk still ships no font files — load the faces yourself or fall through to system. Override via `createTheme({ semantic: { fontFamily: { sans: '…' } } })` or the `--silk-font-*` CSS variables.

- 1115c4a: Springs join the `motion` tokens: `snappy`, `brisk` and `smooth` are `Spring`s (`durationMs`, `bounce`) for position and size, beside the `fast`/`normal`/`slow` fades. The web gets `--silk-motion-{snappy|brisk|smooth}-duration-ms` and `-easing`; silk-native adds `springTo` (a spring that keeps a release speed) and `useMotion` (a token as a Reanimated transition), and the bottom sheet springs on `motion.smooth`.

  **Breaking:** a full `motion` literal now needs `snappy`, `brisk` and `smooth` (e.g. `snappy: { durationMs: 250, bounce: 0.15 }`), and a loop over `motionNames` that reads `.easing` must check `isSpringName(name)` first.

- 86729e5: Add `MotionList` and `MotionView` to `silk-native`: a list whose items glide to where a change moves them on the theme's `brisk` spring, keeping their speed when interrupted, and fade in (and out, on the web) on the theme's `normal` and `fast` durations with the change you name. Add `sampleSpringOffsets` to `silk-core`, which samples a spring from any offset and speed.
- 71d1fc5: Add `Dialog` (centered, or a bottom sheet), `Popover` and `Listbox` overlays to `@reactive/silk-native`, with their `SilkDefaults` keys and mappers. On the web, `Popover` is non-modal (a hover-opened menu keeps working) and moves focus in as it opens unless `Popover.Content`'s `onOpenAutoFocus` calls `preventDefault()`. `Listbox.ItemText` colors custom item text as the label, or with `tone="secondary"` as a description; both dim on a disabled item. It adds a `placement` axis (`center` | `bottom`) on `dialogRecipe` that web `Dialog.Content` styles too. Also fixes `data-*` attributes on native components under react-native-web, which it had been dropping.
- 2121bab: breaking: themes pinning the blended `hover` hex values (light accent, danger and success; neutral in both schemes) must re-derive them, because hover fills now blend in OKLab instead of sRGB (default light accent `#0f5399` → `#135297`).

  Adds `oklch(l, c, h, alpha?)` (from `@reactive/silk-core`, its `/color` subpath, and `@reactive/silk`), which returns a color's sRGB form and throws a `RangeError` on input out of range. Built-in palettes are kept as OKLCH coordinates and resolve to the same hex; `generateScale` reads its curves from them, so generated scales can move by one hex step. Web `color-mix()` blends in Oklab, which shifts the indeterminate Progress bar's reduced-motion fill slightly.

- 09d876d: Foundation release: platform-neutral tokens/theme/recipes in `@reactive/silk-core`, web renderer with Linaria + Radix exemplars (Box, Stack, Text, Button, Avatar, Dialog, Identity), ThemeProvider/SilkProvider, and registry scaffold.
- 3bf1155: Layout flow direction is a property of the component, never a prop: `Stack` is vertical, `Inline` is horizontal, and neither can flip its axis.

  A `direction` prop would mean the same `align`/`justify` values silently swap visual axis per call site. Fixing the axis per component — rather than renaming the props — keeps the standard flexbox reading of `align` and `justify` correct everywhere.

  - **`Stack` is vertical-only.** `stackRecipe.variants` is exactly `gap`, `align`, `justify`, `rail`. Reach for `Inline` for horizontal flow; it additionally carries `wrap`, `direction` (`row | row-reverse`, order rather than axis), and the web-only `collapseBelow`.
  - **Choosing between them:** vertical is `Stack`, horizontal is `Inline`. Their defaults differ deliberately — `Stack` is `align="stretch"`, `Inline` is `align="center"` and `wrap="wrap"` — so set `align`/`wrap` explicitly when a row must stretch to equal heights or must not reflow.
  - **Centering** is `align`/`justify` set to `"center"`. `Container` owns max-width measure centering (`margin-inline: auto` + `max-width`).
  - **`Grid` has `justify`** (`start | center | end | stretch`, default `stretch`) mapped to `justify-items`, pairing with `align` → `align-items`: `columns` always emits `1fr` tracks, so there is no free space for `justify-content` to distribute. On `Stack` and `Inline`, `justify` is `justify-content`.

- 7b6407b: Stage 1 layout system: `Inline`, `Grid`, `Container`, `Separator`, and `Box` padding; system density via `compactSpace` + `data-density` space remaps; web-only `collapseBelow` container queries; ThemeProvider density / nested theme inheritance.
- 338fe46: Stage 2 visual primitives and forms foundation.

  **breaking:**

  - `ToneName`: add `success` to every exhaustive `Record<ToneName, …>` / switch.
  - `InteractionToneColors`: add required `text`, `subtleHover`, and `subtleActive` (old soft/outline/ghost remaps of `border`/`hover` are gone — use the new slots).
  - `SemanticTokens`: add `color.surfaceSunken`, `color.overlay`, `shadow.{raised,overlay}`, and `focusRing.{width,offset}`; typography adds `headingSm` / `headingXl`.
  - Light solid fills use palette step 11 (was 9) so `onSolid: #fff` meets WCAG 4.5:1.
  - `createSharedSemanticScales()` is removed — use the `sharedSemanticScales` constant.
  - `MotionName` adds `loop` (1200ms, linear) for continuous indeterminate motion; `fast`/`normal`/`slow` stay one-shot transition durations. Exhaustive `Record<MotionName, …>` literals must add `loop`.
  - Tone `hover` / `active` are now three distinct fills alongside `solid` in both schemes. Light `hover` is blended between palette steps 11 and 12 rather than being step 12 (which collided with `active`), and neutral `active` is step 11 rather than step 12 (which collided with `solid`). Themes that hardcoded those hex values must re-derive them.
  - `FieldContextValue` drops `controlId`; `inputId` is now the single resolved control id. `Field.Root` gains `controlId` for naming that control — setting `id` on the control itself no longer retargets Label `htmlFor`, which previously required a post-hydration effect and produced a dangling `for=` on the server.

  Adds `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`; settings-form fixture; contrast and theming acceptance tests.

- 2c7c49f: Stage 3 interaction primitives: Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, ScrollArea, Toast, Toggle/ToggleGroup — shared floating-surface motion, recipes, portal theme reconstitution, InspectorPanel fixture, and CI performance budgets.
- 3bf1155: Stage 4 composites: product components, serializable models, and composition standard.

  - Add `@reactive/silk-core/models` (Identity/Stat/Media/Post/Comment/Notification/Profile/FeedEntry) and composite recipes.
  - Close primitive gaps: Card/Surface `interactive` hover elevation, Inline `direction`, Stack `rail`, `StatusDot`.
  - Ship composites: MediaObject, ActionBar, StatGroup, EmptyState, PostCard, Comment, CommentThread, Notification, FeedItem, ProfileCard, SettingsPanel.
  - Document the compound-first dual API in `docs/COMPOSITES.md`.
  - Retrofit Identity onto Inline (additive `model` prop — non-breaking).
  - SocialFeed exit fixture; registry sync script emits consumer-owned composite source.

- e2aa5b9: Stage 5 theming maturity (core): palette generation, paired dark derivation, and contrast auditing.

  - Add `generateScale(seedHex, colorScheme)` — OKLCH 12-step ramps from canonical sRGB hex.
  - Add `generatePairedPalette(brandHex)` — tenant recipe producing full light+dark palettes (accent + brand-tinted gray; optional danger/success seeds).
  - Add `checkThemeContrast`, `contrastRatio`, `relativeLuminance`, and `parseCanonicalHex` for CI/tooling.
  - Depends on `culori` for OKLCH conversion and gamut mapping (private to the generator).
