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

## Stage 1 — Layout system

Complete the layout vocabulary so nothing downstream reaches for ad hoc flex/grid CSS.

- Components: `Inline`, `Grid`, `Center`, `Container`, `Separator`; extend `Box`/`Stack` as gaps appear.
- Decide and document the **responsive strategy** (web-only concern; must not leak into core recipes). Container queries vs. viewport breakpoints; how responsive props are expressed without runtime style generation.
- Density: wire the `density` axis through spacing tokens so it is a real system-level control, not per-component.
- **Native contract spike** (pulled forward from Stage 6): a throwaway Expo app under `apps/` consuming `silk-core` directly — theme delivery plus `Box`/`Stack`/`Text`/`Button` — to catch web-shaped assumptions in tokens and recipes while the contracts are still cheap to change. Findings fold back into core; nothing is published. Stage 6 graduates this into a real package.
- **Pre-1.0 API policy**: define what counts as public API (component props, semantic token names, public CSS variables, recipe shapes, core utilities like `defineRecipe`/`createTheme`) and the breaking-change rules changesets enforce — *before* the component surface grows. Stage 7 matures this into deprecation and codemod policy.

**Exit criteria:** a realistic page skeleton (header / content / sidebar / footer) can be built from layout primitives alone; responsive strategy documented in ARCHITECTURE.md; the native spike renders core-driven exemplars in Expo with divergences resolved or logged as justified; the pre-1.0 API policy is documented.

---

## Stage 2 — Visual primitives & forms foundation

Establish the full visual language and the accessibility-critical form layer.

- Components: `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`.
- Forms: `Input`, `Textarea`, and `Field` (label / description / error wiring with correct `aria-*` associations — this is the a11y-sensitive piece; use Radix primitives where applicable).
- Audit semantic tokens against real usage: interaction tones, focus rings, disabled states, elevation/`surfaceRaised`. Fix the semantic layer rather than adding component one-offs.

**Exit criteria:** a complete settings-style form can be composed accessibly from Silk primitives; token audit results folded back into core.

---

## Stage 3 — Interaction primitives

Wrap the remaining Radix behaviors. `Dialog` is the template: Radix owns behavior, Silk owns visuals, portals reconstitute theme scope.

- Components: `Popover`, `Tooltip`, `DropdownMenu`, `Tabs`, `Accordion`, `Select`, `ScrollArea`, `Toast`.
- Shared patterns extracted once, not per component: portal theming, overlay/motion tokens, positioning surfaces (popover-like components share visual treatment).
- Motion: define motion tokens (durations, easings) in core; respect `prefers-reduced-motion` on web.

**Exit criteria:** all listed components shipped with stories and a11y tests; a shared "floating surface" style layer exists instead of per-component duplication.

---

## Stage 4 — Composites (product components)

Where product value lives. Built from Silk primitives, never raw DOM. `Identity` is the exemplar.

- Building blocks: `MediaObject`, `ActionBar`, `StatGroup`.
- Social: `PostCard`, `Comment`, `CommentThread`, `Notification`, `FeedItem`, `ProfileCard`, `SettingsPanel`.
- Settle the **slot architecture** question (open design question from the brief): compound components + context, convenience props on top — document the chosen pattern as the standard for all composites.
- Composite models (the data-shape contracts composites accept) defined in core so native can share them.

**Exit criteria:** a plausible social feed page can be assembled from composites alone; slot/composition pattern documented; composite models live in `silk-core`.

---

## Stage 5 — Theming maturity

Harden theming from "works" to "product-grade multi-tenant".

- Nested themes: exercise and document sub-tree theming (including portals) under real composition.
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
| Semantic vs. component tokens, how many | Stage 2/5 | Partially — sparse component tokens; audit pending |
| Responsive strategy | Stage 1 | Open |
| Slot architecture for composites | Stage 4 | Open (Identity prototype exists) |
| Variant expression (typed, tree-shakeable, RN-friendly) | Stage 0/1 | Proven on web; native spike validates in Stage 1 |
| Registry: packages vs. generated source | Stage 7 | Scaffolded; final split pending |
