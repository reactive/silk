# Pre-1.0 API Policy

Silk is pre-1.0. This document defines what counts as **public API** and how breaking changes are communicated via changesets. Stage 7 will mature this into deprecation and codemod policy.

## What is public API

| Surface | Examples | Breakage rule |
| --- | --- | --- |
| Component props | `variant`, `tone`, `size`, `density`, `gap`, `collapseBelow`, `asChild` | Removing or renaming a prop, or changing its semantics, is breaking |
| Semantic token names | `surface`, `textPrimary`, `tones.accent.solid`, space steps `0`–`10` | Renaming or removing a token key is breaking |
| Public CSS variables | `--silk-color-surface`, `--silk-color-surface-sunken`, `--silk-color-overlay`, `--silk-shadow-raised`, `--silk-shadow-overlay`, `--silk-color-tone-*-text`, `--silk-space-2`, `--silk-button-bg`, `--silk-grid-min` | Removing or changing the meaning of a documented `--silk-*` variable is breaking |
| Recipe shapes | `buttonRecipe.variants`, `stackRecipe.defaults` | Removing an axis or declared value is breaking |
| Core utilities | `defineRecipe`, `createTheme`, `compactSpace`, `DensityName` | Signature or behavioral changes that affect consumers are breaking |
| Package exports / subpaths | `@reactive/silk`, `@reactive/silk-core/tokens`, `@reactive/silk/styles.css` | Removing an export path is breaking |

**Not public API** (may change without a major bump pre-1.0, but still prefer a changeset note):

- Private CSS variables (`--_tone-solid`, `--_bg`, …)
- Internal file paths under `src/`
- Throwaway apps (`apps/native-spike`)
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
