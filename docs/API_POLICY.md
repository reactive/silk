# Pre-1.0 API Policy

Silk is pre-1.0. This document defines what counts as **public API** and how breaking changes are communicated via changesets. Stage 7 will mature this into deprecation and codemod policy.

## What is public API

| Surface | Examples | Breakage rule |
| --- | --- | --- |
| Component props | `variant`, `tone`, `size`, `density`, `gap`, `collapseBelow`, `asChild` | Removing or renaming a prop, or changing its semantics, is breaking |
| Semantic token names | `surface`, `textPrimary`, `tones.accent.solid`, space steps `0`–`10` | Renaming or removing a token key is breaking |
| Public CSS variables | `--silk-color-surface`, `--silk-space-2`, `--silk-button-bg`, `--silk-grid-min` | Removing or changing the meaning of a documented `--silk-*` variable is breaking |
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

## Escape hatches stay

Shipping a component without the customization ladder’s escape-hatch level (`className`, `style`, `ref`, data attributes, public component CSS variables, `asChild` where sensible) is a regression, not a simplification — see [PRINCIPLES.md](PRINCIPLES.md).

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — how the system is built
- [PRINCIPLES.md](PRINCIPLES.md) — charter and drift checklist
- [ROADMAP.md](ROADMAP.md) — Stage 7 graduates this into deprecation / codemod policy
