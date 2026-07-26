# Composite composition standard

Stage 4 settles the slot architecture for Silk product components. This document is the standard; `Identity` is the reference implementation.

## Dual API, compound-first

1. **Compound parts are the source of truth.** `X.Root` provides context (shared variant state). Named parts (`X.Header`, `X.Body`, …) render semantic HTML styled purely by Silk primitives. Parts throw when used outside their matching `Root`.
2. **Convenience form is thin sugar.** The callable component accepts a serializable *model* (from `@reactive/silk-core/models`) plus web-only `ReactNode` overrides and expands to compound parts — no logic compound users cannot replicate.
3. **Prop surface parity with primitives.** Parts extend `ComponentPropsWithoutRef` of their host, forward refs, pass through `data-*` / ARIA / `className` / `style`, and support `asChild` where the part is a single element (same `Slot.Root` conventions as `Inline` / `Card`).
4. **No bespoke CSS in composites.** Structure comes from `Stack` / `Inline` / `Grid` / `Box`; surfaces from `Card` / `Surface`. When a visual cannot be expressed, extend the primitive — never add Linaria in a composite.
5. **Customization ladder** (all four levels required): theme → `SilkProvider` defaults → recipe variants → ranked escapes (`--silk-*` vars → `styled`/`className` → `style`).

**Renderer utilities** (not compound composites): `FeedItem` and `CommentThread` are thin orchestrators over other composites/models. They intentionally expose a props-only API rather than `Root`/parts.

## Precedence and nesting

| Rule | Behavior |
| --- | --- |
| Prop precedence | Explicit slot/prop → model field → provider default → primitive/recipe default. `null` on an optional convenience prop clears a model value. |
| Nested Roots | Valid. Parts consume the **nearest** matching Root context. |
| Required parts | Compound Roots do not enforce required children. Convenience APIs enforce their minimum input through types (e.g. `name` or `model`). |
| Convenience + children | Convenience forms do not accept compound children; use the compound API when you need custom structure. |

## Models

Composite models live in `@reactive/silk-core/models`. They are **strictly serializable** (strings, numbers, booleans, ids, ISO-8601 timestamps, URL strings, action descriptors). No `ReactNode`, callbacks, or DOM types. Rich content and event handlers stay as web-side convenience overrides.

## Design language

Applied uniformly by Stage 4 social composites:

- **Surface rhythm:** feed items on `Card` (`elevation="raised"`, `radius="lg"`); nested content steps down to `flat` / `sunken` with `radius="md"`.
- **Spacing:** internal `space-3`, section `space-4`, inter-card `space-5`. Density is inherited — set `density="compact"` explicitly when a nested section should compact.
- **Typography:** author = `label`, body = `body`, meta/timestamps = `caption` + `textSecondary`, stat values = `headingSm`. Posts render `<article>`; post timestamps sit on the identity meta line (`@handle · Jul 26, 11:00 AM`); comments use a single byline (`Name · @handle · 11:00 AM`) with time-only stamps; threads render unstyled lists. Post engagement is a caption summary (`128 likes · 14 replies`), not a competing StatGroup dashboard.
- **Tone:** neutral by default; `accent` for primary actions and unread; `danger` / `success` for deltas and destructive actions. Unread notifications use `StatusDot` alone (accessible name on the dot) — no redundant “Unread” chrome.
- **Motion:** hover elevation via Card/Surface `interactive="true"` on real `asChild` links/buttons only — never a fake-control flag. Respects `prefers-reduced-motion`.
- **Threading:** a single `rail="start"` on the first reply group; deeper levels indent without stacking borders. Compact Comment (`size="sm"`, one-line byline, ghost/compact ActionBar); list bullets reset.
- **Profile cards:** identity and primary actions share a header row; bio and stats follow underneath.

## Checklist for every new composite

- [ ] Compound parts + optional convenience form
- [ ] Recipe in core when real variant axes exist; `SilkDefaults` entry
- [ ] Host props / ref / `data-*` / `asChild` decisions documented in types
- [ ] Story under `Components/Composite/*` (variants, theming, escape hatches)
- [ ] Keyboard / focus / accessible-name tests + axe
- [ ] SSR smoke entry; recipe conformance for CSS-backed axes
- [ ] Registry source generated from package source (not npm re-export)
