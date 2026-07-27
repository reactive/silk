# Pre-1.0 API Policy

Silk is pre-1.0. This document defines what counts as **public API** and how breaking changes are communicated via changesets. Stage 7 will mature this into deprecation and codemod policy.

## What is public API

| Surface | Examples | Breakage rule |
| --- | --- | --- |
| Component props | `variant`, `tone`, `size`, `density`, `gap`, `collapseBelow`, `asChild` | Removing or renaming a prop, or changing its semantics, is breaking |
| Semantic token names | `surface`, `textPrimary`, `tones.accent.solid`, space steps `0`–`10` | Renaming or removing a token key is breaking |
| Public CSS variables | `--silk-color-surface`, `--silk-color-surface-sunken`, `--silk-color-overlay`, `--silk-shadow-raised`, `--silk-shadow-overlay`, `--silk-color-tone-*-text`, `--silk-space-2`, `--silk-button-bg`, `--silk-grid-min` | Removing or changing the meaning of a documented `--silk-*` variable is breaking |
| Recipe shapes | `buttonRecipe.variants`, `stackRecipe.defaults` | Removing an axis or declared value is breaking |
| Core utilities | `defineRecipe`, `createTheme`, `generateScale`, `generatePairedPalette`, `checkThemeContrast`, `contrastRatio`, `relativeLuminance`, `compactSpace`, `DensityName` | Signature or behavioral changes that affect consumers are breaking |
| Package exports / subpaths | `@reactive/silk`, `@reactive/silk-core/tokens`, `@reactive/silk/styles.css`, `@reactive/silk-native` | Removing an export path is breaking |

**Not public API** (may change without a major bump pre-1.0, but still prefer a changeset note):

- Private CSS variables (`--_tone-solid`, `--_bg`, …)
- Internal file paths under `src/`
- Example apps (`apps/native-example`, `apps/docs`)
- Storybook docs helpers (`VariantMatrix`, fixture chrome styles)

## Pre-1.0 versioning

Until 1.0:

- **Minor** — new components, new optional props, new token keys, new recipe axes/values (additive).
- **Patch** — bug fixes, docs, non-behavioral refactors.
- **Breaking changes are allowed** in minors before 1.0, but **must** ship with a changeset that says `breaking:` (or Changesets major) so consumers see them in the changelog. Prefer additive evolution when possible.

## Changeset conventions

Every user-facing change gets a changeset (`yarn changeset`):

- Name the packages affected (`@reactive/silk-core`, `@reactive/silk`).
- Summarize the consumer-visible delta in one or two sentences.
- For breaks, lead with what to migrate: old → new.

## Stage 2 public additions (breaking notes)

- **`ToneName` includes `success`** — widens `Record<ToneName, InteractionToneColors>`. Exhaustive consumer switches/records must add `success`. *breaking:* extend tone maps.
- **`InteractionToneColors.text`** — new required tone slot for colored body text on surfaces (distinct from `solid` fill in dark). *breaking:* tone object literals need `text`.
- **Surfaces:** `color.surfaceSunken`, `color.overlay`; **`shadow.raised` / `shadow.overlay`** complete shadow-layer records.
- **Typography roles:** `headingSm`, `headingXl`.
- **`InteractionToneColors.subtleHover` / `subtleActive`** — soft/outline/ghost fill states; do not reuse `border` as a background. *breaking:* tone object literals need both keys.
- **`semantic.focusRing` geometry** — `{ width, offset }` (px-equivalent); serialized as `--silk-focus-ring-width` / `--silk-focus-ring-offset`. Tone color remains `tones.*.focusRing`.
- **`motion.loop`** — one cycle of continuous indeterminate motion (Skeleton/Progress shimmer, Spinner), 1200ms linear. `fast`/`normal`/`slow` remain one-shot transition durations and must not be used for looping animation. *breaking:* motion records need `loop`.
- **Tone interaction ramp** — `solid` / `hover` / `active` are three distinct fills in every scheme, all keeping `onSolid` at 4.5:1. Light `hover` is blended between palette steps 11 and 12 because `solid` sits at 11 with only one step of headroom. *breaking:* themes pinning those hex values must re-derive them.
- **`Field.Root controlId`** — names the labelled control so `Field.Label htmlFor` and the control agree during server rendering. `FieldContextValue.controlId` is gone; `inputId` is the one resolved id. Setting `id` on a control inside a Field no longer retargets the label. *breaking:* move control-level `id` overrides up to `Field.Root controlId`.
- Compact space remains the fixed `compactSpace` scale (not overridable via `createTheme.semantic.space`).

## Stage 5 public additions

- **`generateScale(seedHex, colorScheme)`** — OKLCH 12-step `PaletteScale` from canonical sRGB hex (`#RGB` / `#RRGGBB`); invalid input throws. Stable: hex input contract, 12-step shape, lowercase `#rrggbb` output. May improve: exact L/C curves between minors (validate with `checkThemeContrast`).
- **`generatePairedPalette(brandHex, options?)`** — tenant recipe → `{ light, dark }` palettes (`blue`/`gray` from brand; `red`/`green` default or optional seeds). Dark derivation is a full palette, not accent-only.
- **`checkThemeContrast(theme)`** → `{ ok, violations }` with discriminated kinds `contrast` \| `unsupported-color` \| `distinctness`. Hex-only audit; non-hex semantic colors are diagnostics, not silent passes.
- **`contrastRatio` / `relativeLuminance` / `parseCanonicalHex`** — platform-neutral hex contrast helpers.
- **Theme scope channels** — `semanticVars` vs `customVars` on web theme scope (behavior change for named-inside-tenant portals: component hooks now inherit; semantic vars still drop).
- **Public component CSS-var list frozen** in `silkComponentVarMeta` (documented in Theming.mdx). Removals/renames/meaning changes are breaking.

## Stage 6 public additions

- **`@reactive/silk-native`** — React Native renderer package. Root export only. Peers: `react` ^19, `react-native` >=0.83.
- **Theme delivery:** `ThemeProvider` / `SilkProvider` / `useTheme` / `useThemeDensity` — context `{ theme, density }` (no CSS variables). Nesting: omitted theme/scheme reuses parent Theme; explicit `colorScheme` creates a fresh default theme; explicit `theme` wins; density inherits independently; `'system'` via Appearance.
- **Native `SilkDefaults`:** recipe-bearing keys only — `Box` / `Stack` / `Inline` / `Text` / `Button` / `Surface` / `Card` / `Heading` / `Badge` / `Separator` / `Avatar` / `StatusDot` / `Skeleton` / `Spinner` / `Progress` / `Input` / `Textarea` / `Checkbox` / `Switch` / `RadioGroup`. **Not** `Field` (no recipe, matches web). Nested defaults replace the map.
- **Components (layout/visual):** `Box`, `Stack`, `Inline` (no web-only `collapseBelow`), `Text`, `Button`, `Surface`, `Card`, `Heading`, `Badge`, `Separator`, `Avatar`, `StatusDot`, `Skeleton`, `Spinner`, `Progress` — same recipe prop axes as web. Escape hatches: `style` (last; Pressable hosts compose style callbacks), typed `ref`, RN host props. `Surface`/`Card` `interactive` is styling-only; pressability requires `onPress`.
- **Components (forms):** `Input`, `Textarea`, `Field` (`Root`/`Label`/`Description`/`Error` + `useFieldControlProps` / `useFieldContext` / `fieldLabelAssociation`), `Checkbox` (tri-state `boolean | 'indeterminate'`, same as web/Radix), `Switch`, `RadioGroup` (`Root`/`Item`). Field public contract matches web (`mode`, `orientation`, `controlId`, `invalid`, `disabled`, `required`, explicit-prop precedence, nested boundaries); association mechanics are renderer-specific (`nativeID`, Android `accessibilityLabelledBy`, composed `accessibilityLabel`/`accessibilityHint`).
- **Deferred:** native `Slider` — web's array-valued multi-thumb Radix contract must not be forked into a scalar API; ships in a follow-up on a vetted native-backed binding or with the full array contract.
- **Public mapper helpers:** `mapBoxStyle` / `mapStackStyle` / `mapInlineStyle` / `mapTextStyle` / `mapButtonStyle` / `mapSurfaceStyle` / `mapCardStyle` / `mapHeadingStyle` / `mapBadgeStyle` / `mapSeparatorStyle` / `mapAvatarStyle` / `mapStatusDotStyle` / `mapSkeletonStyle` / `mapSpinnerStyle` / `mapProgressStyle` / `mapInputStyle` / `mapTextareaStyle` / `mapCheckboxStyle` / `mapSwitchStyle` / `mapRadioGroupStyle` / `mapRadioItemStyle`, plus `mapShadow` / `elevationBackground` / `resolveNativeFontFamily` / `checkboxIndicatorColor` (RN-import-free). Control geometry constants stay package-internal.
- **A11y compat helpers:** `a11yState` / `a11yValue` — emit RN object props + RNW/ARIA aliases (`aria-checked`, `aria-valuemin/max/now/text`). `useReducedMotion` subscribes to OS / `prefers-reduced-motion`.

## Stage 3 public additions

- **Recipes:** `popoverRecipe` (`size`), `tabsRecipe` (`variant`), `selectRecipe` (`size`/`density`), `toastRecipe` (`tone`), `toggleRecipe` (`size`) — shared by Toggle and ToggleGroup.
- **Components (web):** `Popover`, `Tooltip` (+ app-level `Tooltip.Provider`), `DropdownMenu`, `Select` (defaults `position="popper"`), `Tabs`, `Accordion`, `ScrollArea`, `Toast`, `Toggle`, `ToggleGroup`.
- **Select public CSS variables:** `--silk-select-bg`, `--silk-select-border`, `--silk-select-radius` (distinct from `--silk-input-*`).
- **SilkDefaults keys:** `Popover`, `Tabs`, `Select`, `Toast`, `Toggle`, `ToggleGroup`.
- **Charter:** constant SSR `<style>` from behavior bindings permitted (ScrollArea Viewport). See PRINCIPLES amendment 2026-07-26.

## Escape hatches stay

Shipping a component without the customization ladder’s escape-hatch level (`className`, `style`, `ref`, data attributes, public component CSS variables, `asChild` where sensible) is a regression, not a simplification — see [PRINCIPLES.md](PRINCIPLES.md).

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — how the system is built
- [PRINCIPLES.md](PRINCIPLES.md) — charter and drift checklist
- [ROADMAP.md](ROADMAP.md) — Stage 7 graduates this into deprecation / codemod policy
