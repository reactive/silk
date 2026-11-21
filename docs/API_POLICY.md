# Pre-1.0 API Policy

Silk is pre-1.0. This document defines what counts as **public API** and how breaking changes are communicated via changesets. Stage 7 will mature this into deprecation and codemod policy.

## What is public API

| Surface | Examples | Breakage rule |
| --- | --- | --- |
| Component props | `variant`, `tone`, `size`, `density`, `gap`, `collapseBelow`, `asChild` | Removing or renaming a prop, or changing its semantics, is breaking |
| Semantic token names | `surface`, `textPrimary`, `tones.accent.solid`, space steps `0`–`10` | Renaming or removing a token key is breaking |
| Public CSS variables | `--silk-color-surface`, `--silk-color-surface-sunken`, `--silk-color-overlay`, `--silk-shadow-raised`, `--silk-shadow-overlay`, `--silk-color-tone-*-text`, `--silk-space-2`, `--silk-button-bg`, `--silk-grid-min` | Removing or changing the meaning of a documented `--silk-*` variable is breaking |
| Recipe shapes | `buttonRecipe.variants`, `stackRecipe.defaults` | Removing an axis or declared value is breaking |
| Core utilities | `defineRecipe`, `createTheme`, `generateScale`, `generatePairedPalette`, `checkThemeContrast`, `contrastRatio`, `relativeLuminance`, `oklch`, `compactSpace`, `DensityName` | Signature or behavioral changes that affect consumers are breaking |
| Package exports / subpaths | `@reactive/silk`, `@reactive/silk-core/tokens`, `@reactive/silk-core/color`, `@reactive/silk/styles.css`, `@reactive/silk-native` | Removing an export path is breaking |

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
- **Native `SilkDefaults`:** recipe-bearing keys only — `Box` / `Stack` / `Inline` / `Text` / `Button` / `Surface` / `Card` / `Heading` / `Badge` / `Separator` / `Avatar` / `StatusDot` / `Skeleton` / `Spinner` / `Progress` / `Input` / `Textarea` / `Checkbox` / `Switch` / `RadioGroup` / `Slider`. **Not** `Field` (no recipe, matches web). Nested defaults replace the map.
- **Components (layout/visual):** `Box`, `Stack`, `Inline` (no web-only `collapseBelow`), `Text`, `Button`, `Surface`, `Card`, `Heading`, `Badge`, `Separator`, `Avatar`, `StatusDot`, `Skeleton`, `Spinner`, `Progress` — same recipe prop axes as web. Escape hatches: `style` (last; Pressable hosts compose style callbacks), typed `ref`, RN host props. `Surface`/`Card` `interactive` is styling-only; pressability requires `onPress`.
- **Components (forms):** `Input`, `Textarea`, `Field` (`Root`/`Label`/`Description`/`Error` + `useFieldControlProps` / `useFieldContext` / `fieldLabelAssociation`), `Checkbox` (tri-state `boolean | 'indeterminate'`, same as web/Radix), `Switch`, `RadioGroup` (`Root`/`Item`). Field public contract matches web (`mode`, `orientation`, `controlId`, `invalid`, `disabled`, `required`, explicit-prop precedence, nested boundaries); association mechanics are renderer-specific (`nativeID`, Android `accessibilityLabelledBy`, composed `accessibilityLabel`/`accessibilityHint`).
- **Keyboard focus:** `Pressable` — React Native's Pressable plus Silk's focus ring: while it has visible focus (the browser's `:focus-visible` on web; any focus on native, which only keyboard, D-pad or assistive technology gives) it draws the `focusRing` tone's color (default `accent`, `false` for none) at `semantic.focusRing` geometry as an outline; `style` composes after it, so a consumer can adjust it (e.g. `outlineOffset` in a dense list). `style`/`children` functions also receive `hovered` and `focusVisible`. `Button` rings in its tone, and a pressable `Card` or `Surface` in `accent`; `Checkbox` / `Switch` / `RadioGroup.Item` in theirs, or `danger` when invalid (web parity). `mapFocusRingStyle(theme, tone)` is the RN-import-free mapper.
- **Native `Slider`** — web's contract (Radix's): `value` / `defaultValue` arrays, one number per thumb, `onValueChange` / `onValueCommit`, `min` / `max` / `step`, `minStepsBetweenThumbs`, `orientation`, `dir`, `inverted`, `disabled`, `thumbLabels`, `thumbValueText`, `size` / `tone`. No `name` or form inputs (React Native has no forms); Field-labelled like web. Each thumb is `adjustable` (`slider` on the web) with increment and decrement actions. A horizontal slider is 100% wide, as web's is; a horizontal `Field` puts its control in a box sized to its content, so a slider there needs a `width` of its own. A thumb's center runs from half a thumb past the start to half a thumb before the end (Radix's in-bounds rule). `children` draw over the track, under the thumbs, and take no touches; inside them `useSliderMarkStyle()` returns `(value, offset?) => style`, which places a mark where a thumb sits at `value` (following `orientation`, `dir` and `inverted`), `offset` further along.
- **Public mapper helpers:** `mapBoxStyle` / `mapStackStyle` / `mapInlineStyle` / `mapTextStyle` / `mapButtonStyle` / `mapSurfaceStyle` / `mapCardStyle` / `mapHeadingStyle` / `mapBadgeStyle` / `mapSeparatorStyle` / `mapAvatarStyle` / `mapStatusDotStyle` / `mapSkeletonStyle` / `mapSpinnerStyle` / `mapProgressStyle` / `mapInputStyle` / `mapTextareaStyle` / `mapCheckboxStyle` / `mapSwitchStyle` / `mapSliderStyle` / `mapRadioGroupStyle` / `mapRadioItemStyle`, plus `mapShadow` / `elevationBackground` / `resolveNativeFontFamily` / `checkboxIndicatorColor` / `mapFocusRingStyle` (RN-import-free). Control geometry constants stay package-internal.
- **A11y compat helpers:** `a11yState` / `a11yValue` — emit RN object props + RNW/ARIA aliases (`aria-checked`, `aria-valuemin/max/now/text`). `useReducedMotion` subscribes to OS / `prefers-reduced-motion`; `useMotionPreference` (`'full' | 'reduced' | 'unresolved'`) exposes the native window before async `AccessibilityInfo` answers, so components that swap in a distinct reduced-motion appearance only do so on a confirmed `'reduced'`.

## Native overlay additions

- **`dialogRecipe.placement`** — `'center' | 'bottom'` (default `'center'`). `bottom` is a sheet: risen from the bottom edge, flush with it, top corners rounded. Web `Dialog.Content` emits `data-placement` and styles both.
- **`silk-native` `Dialog`** — `Root` (`open`, `onOpenChange`, controlled), `Content` (`size`, `placement`, `overlayStyle`, View props), `Title` (a `Heading`, level 2, size `md`). React Native `Modal` on both platforms; `aria-modal` on the web; closes on a veil press, Escape (web) and the back button (Android). On Android a bottom sheet runs to the screen's bottom edge, under the navigation bar when the app is edge-to-edge; React Native has no inset API, so the caller adds the bottom inset (react-native-safe-area-context) to `Content`'s padding.
- **`silk-native` `Popover`** — `Root` (`open`, `onOpenChange`, `anchor` ref), `Content` (`size`, `side`, `align`, `sideOffset` 4, `collisionPadding` 8, `onOpenAutoFocus`, View props). Non-modal on the web (Radix `DismissableLayer` and untrapped `FocusScope` in a body portal); a transparent `Modal` on native. On the web, focus moves in as it opens as in Radix `Popover` (its first Tab stop that isn't a link, else the surface; skipped when something inside already took focus) unless `onOpenAutoFocus` calls `preventDefault()`, as a hover-opened menu does. Closes on a press outside it and its anchor (on native the layer covers the anchor, so a press there closes it too), Escape/back, window resize, and scrolling that moves the anchor. Narrows to fit the window, shrinks to the room on its side (long content scrolls in a `ScrollView` the caller wraps it in), and re-places as its content grows, on the side it first took. Inside a `Dialog` is unsupported on the web for now (the dialog's focus trap takes focus back).
- **`silk-native` `Tooltip`** — web's parts: `Root` (`open` / `defaultOpen` / `onOpenChange`, `delayDuration` 700), `Trigger` (a View around what it explains; View props but the pointer, focus and responder handlers it owns), `Content` (`side` `top`, `align`, `sideOffset` 4, `collisionPadding` 8, View props but the pointer enter and leave handlers it owns; a string or number child renders as `Text` in the `label` role), and an optional `Provider` (`delayDuration` for the tooltips inside it; a Root's own wins). No `asChild`: the Trigger is always a box, so a disabled control inside still opens it, which a Radix trigger on a disabled button cannot. Opens on a mouse resting on the trigger and on keyboard focus inside it (web), and on any platform on a press nothing inside takes (a disabled control takes none; an enabled one keeps its press). Closes as the mouse leaves (with 100 ms to reach the tooltip, which a mouse can rest on), as focus leaves, and on a press outside, Escape or the back button. Never takes focus; on native it is the `Popover` layer's transparent `Modal`. The trigger's whole box takes the presses nothing inside takes, so in a pressable row a press there opens the tooltip rather than pressing the row. Keyboard focus can't land on a disabled control, so on the web its tooltip opens only for a mouse or a tap. Screen readers don't read it from the trigger: the control carries the same words (`accessibilityHint`, or `aria-describedby`).
- **`silk-native` `Listbox`** — `Root` (`value`, `onValueChange`, `onHighlightChange`, `autoFocus`, `onKeyDown` (called before the list's own keys), `size`/`density` from `selectRecipe`, View props), `Item` (`value`, `disabled`, Pressable props; a pointer leaving the list clears the highlight unless the list holds focus), `ItemText` (Text colored as the item's label, for custom item children; `tone="secondary"` colors it as the item's description, dimmed with the label when disabled). Web: `listbox`/`option` with one Tab stop once mounted (the highlighted, chosen or first enabled item; in server markup the chosen item, or every enabled item when none is chosen, so a disabled chosen item leaves none until mount) and arrow/Home/End/Space keys that skip disabled items; native: `radiogroup`/`radio`. `autoFocus` acts on mount and whenever it turns on. In a `Dialog`, set `autoFocus`: the dialog's trap focuses its first focusable element, which is the first item, not the chosen one. A pick or Tab closes an enclosing `Popover`.
- **`SilkDefaults` keys (native):** `Dialog`, `Popover`, `Listbox`.
- **Mappers:** `mapDialogStyle`, `mapPopoverStyle`, `mapTooltipStyle`, `mapListboxItemStyle` (+ `ListboxItemState`).
- **Packaging:** `silk-native` depends on `@radix-ui/react-dismissable-layer` and `@radix-ui/react-focus-scope` and takes `react-dom` as an optional peer; its web layer is chosen by the package `imports` entry `#floating-layer` (`react-native` condition → `Modal` layer, `default` → DOM layer).

## OKLCH color additions

- **`oklch(l, c, h, alpha?)`** (also `@reactive/silk-core/color`, which imports nothing) — how Silk writes colors: OKLCH in, sRGB out (`#rrggbb`, or `rgba()` with `alpha`), because React Native can't parse `oklch()`. Stable: that output format, so `checkThemeContrast` and every renderer read it, and a `RangeError` for `l` or `alpha` outside 0–1, negative `c`, or a non-finite value. Unspecified: the output for a color outside sRGB (today each channel is clipped; the intended direction is to keep `l` and `h` and lower `c`, as `generateScale` does). Built-in palettes are written with it, inside sRGB.
- **Built-in palettes as OKLCH coordinates** — `generateScale` reads its curves from them, and interaction `hover` fills blend in OKLab rather than sRGB, so a hover sits between its two steps in perceived lightness and keeps their hue. Both may improve between minors, like `generateScale`'s curves. *breaking:* themes pinning the blended `hover` hex values (light tones, and neutral in both schemes) must re-derive them.

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
