# Silk Roadmap

The staged plan for building Silk into a complete design system. Each stage is a manageable chunk with concrete deliverables and exit criteria. Stages build on each other, but items within a stage can land incrementally.

Every stage is bound by [PRINCIPLES.md](PRINCIPLES.md) — scope may change; the charter may not (without an amendment). Architecture details live in [ARCHITECTURE.md](ARCHITECTURE.md).

## Cross-cutting quality gates

These apply to every stage, not just at the end:

- **Recipe conformance** — every declared variant value appears in extracted CSS (existing conformance test pattern).
- **SSR** — components render server-side with no hydration hacks; theming works via static CSS / CSS variables only.
- **Accessibility** — Silk owns end-to-end accessibility; primitive mechanics come from Radix (or platform equivalents). Wrappers are verified with keyboard/focus/accessible-name assertions plus axe-level checks — using Radix is necessary, not sufficient.
- **Packaging** — `test:packed` consumer check passes; subpath exports stay coherent.
- **Docs** — every shipped component gets a Storybook story covering variants, theming, and escape hatches.
- **Fixtures** — each stage's exit demo is a committed fixture page in the docs app with an explicit state matrix (loading / empty / error / overflow / long content / reduced motion, as applicable), asserted in tests — not a hand-picked screenshot.
- **Performance** — per-component JS size, extracted CSS size, and SSR render cost are tracked; budgets are defined in Stage 3 and enforced by CI comparison thereafter.
- **Changesets** — every user-facing change ships with a changeset.

---

## Stage 0 — Foundation ✅ (done)

The architecture spike, proven end to end.

- `@reactive/silk-core`: palette + semantic tokens, `createTheme`, recipe contracts (`defineRecipe`).
- `@reactive/silk`: web renderer with one exemplar per layer — layout (`Box`, `Stack`), visual (`Text`, `Button`, `Avatar`), interaction (`Dialog`), composite (`Identity`).
- ThemeProvider/SilkProvider: named light/dark via static CSS + `data-theme`; custom/tenant themes via style-attribute CSS variables; portal theme reconstitution.
- Storybook docs site on GitHub Pages; registry scaffold (`registry.json`); CI, changesets, packed-consumer check.

**Exit criteria (met):** one component of each layer works end to end with static extraction, theming, tests, and docs.

---

## Stage 1 — Layout system ✅ (done)

Complete the layout vocabulary so nothing downstream reaches for ad hoc flex/grid CSS.

- Components: `Inline`, `Grid`, `Container`, `Separator`; extend `Box`/`Stack` as gaps appear.
- Decide and document the **responsive strategy** (web-only concern; must not leak into core recipes). Container queries vs. viewport breakpoints; how responsive props are expressed without runtime style generation.
- Density: wire the `density` axis through spacing tokens so it is a real system-level control, not per-component.
- **Native contract spike** (pulled forward from Stage 6): a throwaway Expo app under `apps/` consuming `silk-core` directly — theme delivery plus `Box`/`Stack`/`Text`/`Button` — to catch web-shaped assumptions in tokens and recipes while the contracts are still cheap to change. Findings fold back into core; nothing is published. Stage 6 graduates this into a real package.
- **Pre-1.0 API policy**: define what counts as public API (component props, semantic token names, public CSS variables, recipe shapes, core utilities like `defineRecipe`/`createTheme`) and the breaking-change rules changesets enforce — *before* the component surface grows. Stage 7 matures this into deprecation and codemod policy.

**Exit criteria (met):** a committed fixture page skeleton (header / content / sidebar / footer, with overflow and long-content states) is built from layout primitives alone; responsive strategy documented in ARCHITECTURE.md; the native spike renders core-driven exemplars in Expo with divergences resolved or logged as justified; the pre-1.0 API policy is documented.

---

## Stage 2 — Visual primitives & forms foundation ✅ (done)

Establish the full visual language and the accessibility-critical form layer.

- Components: `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress`.
- Forms: `Input`, `Textarea`, and `Field` (label / description / error wiring with correct `aria-*` associations — this is the a11y-sensitive piece; use Radix primitives where applicable).
- Form controls (Radix-backed): `Checkbox`, `RadioGroup`, `Switch`, `Slider` — required by the settings-form exit criterion below.
- Audit semantic tokens against real usage: interaction tones, focus rings, disabled states, elevation/`surfaceRaised`. Fix the semantic layer rather than adding component one-offs.
- **Theming acceptance tests** (pulled forward from Stage 5): nested themes (including portal reconstitution), `createTheme` partial overrides, and contrast checks in both color schemes run as tests against the growing component set — validating the theme architecture while it is still cheap to change. Stage 5 keeps ergonomics and tooling.

**Exit criteria (met):** a committed settings-form fixture (including error, disabled, loading, reduced-motion, and narrow/long-content states) composes accessibly from Silk primitives; token audit results folded back into core (`success` tone, `surfaceSunken`, `overlay`, shadow elevation levels, `text` tone slot, WCAG-safe solid/focus mappings); theming acceptance tests pass under nesting, partial overrides, and both color schemes.

---

## Stage 3 — Interaction primitives ✅ (done)

Wrap the remaining Radix behaviors. `Dialog` is the template: Radix owns behavior, Silk owns visuals, portals reconstitute theme scope.

- Components: `Popover`, `Tooltip`, `DropdownMenu`, `Tabs`, `Accordion`, `Select`, `ScrollArea`, `Toast`, `Toggle`/`ToggleGroup`.
- Shared patterns extracted once, not per component: portal theming, overlay/motion tokens, positioning surfaces (`floatingSurface` + enter/exit keyframes; Dialog migrated onto them).
- Motion: tokens already in core (`fast`/`normal`/`slow`/`loop`); floating/overlay/accordion/toast animations respect `prefers-reduced-motion`.
- Performance budgets: `scripts/perf-budgets.mjs` + `perf-budgets.json` (isolated consumer JS gzip, CSS totals, informational SSR); CI via `yarn test:perf`.
- API matrix: [STAGE3_API_MATRIX.md](STAGE3_API_MATRIX.md). Charter amendment: constant SSR `<style>` from behavior bindings permitted (ScrollArea).

**Exit criteria (met):** all listed components shipped with stories and a11y tests; shared floating-surface style layer; InspectorPanel fixture with overlay/long-content/reduced-motion/nested-theme/multiple-toast states.

---

## Stage 4 — Composites (product components) ✅ (done)

Where product value lives. Styling and shared behavior come entirely from Silk primitives; semantic HTML is encouraged where it carries meaning (per the charter's output-semantics rule). `Identity` is the exemplar.

- Building blocks: `MediaObject`, `ActionBar`, `StatGroup`, `EmptyState`, `StatusDot`.
- Social: `PostCard`, `Comment`, `CommentThread`, `Notification`, `FeedItem`, `ProfileCard`, `SettingsPanel`.
- Slot architecture settled: dual API, compound-first — documented in [COMPOSITES.md](COMPOSITES.md); `Identity` retrofit (no bespoke CSS).
- Composite models in `@reactive/silk-core/models` (serializable only).
- Primitive gaps closed for the design language: Card/Surface `interactive`, Inline `direction`, Stack `rail`, `StatusDot`.

**Exit criteria (met):** SocialFeed fixture (loading / empty / error / long-thread / narrow / reduced-motion) assembled from composites alone; slot pattern documented; models in `silk-core`.

---

## Stage 5 — Theming maturity

Harden theming from "works" to "product-grade multi-tenant".

- Nested themes: extend the Stage 2 acceptance tests to full-app composition and document the supported patterns.
- Tenant branding: `createTheme` ergonomics for partial overrides, palette generation/contrast guidance, dark-mode derivation.
- Component token audit: confirm the public CSS-variable surface is sparse, documented, and stable (it becomes API).
- Theme preview/dev tooling in Storybook (live token editing against real components).

**Exit criteria:** two visually distinct tenant themes plus light/dark run side by side in docs with no runtime CSS generation; public component-token list documented.

---

## Stage 6 — Native (`@reactive/silk-native`)

Prove the shared layer is actually shared. Meaningful sharing, not pixel parity — native should feel native.

- New package consuming `silk-core` tokens, themes, recipes, and composite models directly (no CSS variables).
- Graduate the Stage 1 native contract spike into a real package: theme delivery (provider + hook), `Box`/`Stack`/`Text`/`Button` first — the same exemplar strategy as Stage 0.
- Platform-specific by design: Dialog/Select/Tooltip/Toast/navigation get native-feeling implementations on their own schedule.
- Example app under `apps/` (Expo).

**Exit criteria:** a native screen renders using the same semantic theme object and recipe contracts as web; any core changes needed for native are made without core learning about React Native views.

---

## Stage 7 — Distribution & DX maturity

Make Silk consumable and evolvable over years.

- Registry: publish composite sources from release tags (not `main`); verify installs are Tailwind-free; decide the final primitives-as-packages vs. composites-as-source split based on Stages 4–6 experience.
- Registry update semantics: installed composite source is a consumer-owned copy, so define how changes reach it — per-item diffs/changelogs each release, compatible `@reactive/silk` version ranges per item, a documented re-add/reconcile workflow, and loud flagging of security-relevant fixes.
- Versioning maturity: deprecation policy, codemod strategy for breaking changes, and the 1.0 stability commitment — building on the pre-1.0 API policy defined in Stage 1.
- Docs completeness: theming guide, customization-ladder guide, contribution guide, per-component API docs.
- Adoption: migration guidance for consuming apps (Anansi SSR integration recipe included).

**Exit criteria:** a new consumer can go from `yarn add` to a themed, SSR-rendered page using only public docs; registry install of a composite works against a pinned release.

---

## Open design questions

Tracked from the founding brief; each has a home stage where it must be resolved and documented:

| Question | Resolved in | Status |
| --- | --- | --- |
| Recipes: shared model vs. per-renderer | Stage 0 | ✅ Shared contracts in core; renderers own styling |
| Semantic vs. component tokens, how many | Stage 2/5 | Partially — Stage 2 audit landed (`success`, surfaces, shadows, tone `text`); Stage 5 freezes public CSS-var list |
| Responsive strategy | Stage 1 | ✅ Intrinsic-first + container queries; `collapseBelow` web-only |
| Slot architecture for composites | Stage 4 | ✅ Dual API, compound-first — [COMPOSITES.md](COMPOSITES.md) |
| Variant expression (typed, tree-shakeable, RN-friendly) | Stage 0/1 | ✅ Proven on web; native spike validates in Stage 1 |
| Registry: packages vs. generated source | Stage 7 | Scaffolded; final split pending |
