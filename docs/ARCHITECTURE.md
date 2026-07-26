# Silk Architecture

Silk is a long-lived design system foundation. It is **not** a Tailwind/shadcn component dump. Radix owns behavior; Silk owns visuals, APIs, and theming.

This document describes how the system is built today. The *why* — goals, constraints, and drift guards — is [PRINCIPLES.md](PRINCIPLES.md); the staged build-out plan is [ROADMAP.md](ROADMAP.md).

## Package boundaries

```text
@reactive/silk-core     platform-neutral tokens, createTheme, recipe contracts
        ↓
@reactive/silk          web renderer (Radix + Linaria + CSS variables)
        ↓ (later)
@reactive/silk-native   React Native renderer consuming the same core
```

Subpaths on core: `@reactive/silk-core`, `/tokens`, `/theme`, `/recipes`.

**Repo layout:** publishable libraries live under `packages/`; runnable consumers (Storybook docs today; playgrounds / native examples later) live under `apps/`.

**Build order:** `silk-core` must emit `dist/` before `silk` builds. Linaria evaluates core imports at build time; missing core dist fails the web build. `yarn workspaces foreach -A -pt run build` handles this topologically.

## Theme model

1. **Palette** — 12-step color scales. Never referenced by components.
2. **Semantic tokens** — surfaces, text, borders, interaction tone contracts, space, radius, typography, motion. Canonical values are platform-neutral (numbers for dimensions; typography `lineHeight` is unitless).
3. **Component tokens** — sparse public CSS variables (`--silk-button-bg`) resolved via private vars:

```css
--_bg: var(--silk-button-bg, var(--_tone-solid));
```

Do **not** declare `--silk-button-bg: var(--silk-accent)` on the component — that shadows consumer overrides.

### Web theme delivery

| Path | Mechanism |
| --- | --- |
| Named light/dark | Static CSS + `data-theme` / `color-scheme` (and `prefers-color-scheme` when unset) |
| Dynamic / tenant | `themeToCssVars(theme)` on the ThemeProvider `style` attribute |
| Nesting | Secondary. Works via DOM variable inheritance in normal flow. Portals reconstitute the nearest ThemeProvider scope (class + `data-theme` + custom CSS vars); pass Dialog `container` when the portal DOM must live inside a subtree. |

Prefer either `theme` (custom object) or `colorScheme` (named/static). If both are passed, `theme` wins for `data-theme` and inline variables. Nested providers inherit omitted `colorScheme` / `density` from the nearest ancestor.

No runtime CSS-in-JS. No ad hoc `<style>` injection per provider. Constant SSR-rendered `<style>` from behavior bindings (Radix ScrollArea Viewport) is allowed when static and nonce-compatible — see PRINCIPLES amendment 2026-07-26.

### Density

System-level density remaps effective space tokens without renaming steps:

| Scale | Source vars | When active |
| --- | --- | --- |
| Comfortable | `--silk-space-comfortable-*` (from `theme.semantic.space` / `defaultSpace`) | Default effective aliases |
| Compact | `--silk-space-compact-*` (from core `compactSpace`) | `[data-density='compact']` |

Effective `--silk-space-*` aliases are owned by `densityClass` (not `themeToCssVars`), so density remaps cannot be overridden by equal-specificity theme rules or inline custom-theme styles. `ThemeProvider` / `SilkProvider` `density` and per-component axes (e.g. Button) set `data-density` so the remap applies for that subtree. Components consume only effective vars — no per-component density padding tables.

### Responsive strategy (web-only)

**Intrinsic-first + container queries.** Layout primitives are fluid by design (`Inline` wraps, `Grid` `columns="auto"` auto-fills, `Container` max-width). There is no viewport breakpoint system and no responsive prop objects in core recipes.

| Concern | Owner |
| --- | --- |
| Fluid defaults | Layout components |
| Container breakpoints (`xs`/`sm`/`md`/`lg`) | `@reactive/silk` only (`containerBreakpoints`) |
| Adaptive switch | Web-only `collapseBelow` on `Stack` / `Inline` → pre-generated `@container (width < Npx)` rules |
| Size containment | `Container` always; `Box contain` opt-in |

Core recipes stay platform-neutral. Native does not implement container queries.

## Variants

Components render `data-*` attributes typed from recipes (`defineRecipe` in core). One Linaria `css` block per component styles them with `:where([data-…])` so specificity stays at single-class level — consumer `className` wins without `!important`.

Tone selectors assign private interaction variables; variant selectors decide how those variables are used (solid / soft / outline / ghost).

Recipes are **contracts** (variant unions + defaults). Web CSS interpolates recipe arrays at build time (proven by the Linaria cross-package spike). A conformance test asserts every declared value appears in extracted CSS.

## Layers

| Layer | Examples | Notes |
| --- | --- | --- |
| Layout | `Box`, `Stack`, `Inline`, `Grid`, `Center`, `Container`, `Separator` | Spacing via CSS variables; responsive via container queries (web) |
| Visual | `Text`, `Button`, `Avatar`, `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress` | `Button` is the reference variant engine; `Surface` owns elevation |
| Interaction | `Dialog`, `Popover`, `Tooltip`, `DropdownMenu`, `Select`, `Tabs`, `Accordion`, `ScrollArea`, `Toast`, `Toggle`/`ToggleGroup`, form controls | Radix behavior, Silk visuals; floating surfaces share `floatingSurface` + Presence-compatible enter/exit keyframes |
| Forms | `Field`, `Input`, `Textarea` | Field owns id/`aria-*` wiring (single vs group modes) |
| Composite | `Identity` | Compound parts + convenience props |

Escape hatches on every component: `className`, `style`, `ref` (React 19 prop), data attributes, `asChild` where sensible.

## Customization levels

1. `createTheme(...)` — semantic theme
2. `SilkProvider` `defaults` — typed per-component defaults (no runtime component registry)
3. Component props — `variant` / `tone` / `size` / `density` / …
4. Escape hatches — public component CSS variables, `className`, `style`, slots/`asChild`

The escape hatches are **ranked, not interchangeable**:

| Reach for | When | Why |
| --- | --- | --- |
| Public CSS variables (`--silk-button-bg`) | The component exposes a hook for what you want to change | Order-independent by construction: the component only ever *reads* the variable, so nothing competes with the consumer's declaration |
| `className` with a Linaria `css` class | Anything static the hooks don't cover | Build-time extraction, no per-render object, and reaches pseudo-classes, `data-*` state, media and container queries — none of which `style` can express |
| `style` | Values only known at runtime (tenant color, computed dimension) | Highest precedence, but the smallest expressive surface and a new object every render |

`cssVars()` types the hooks for the `style` prop; React's `CSSProperties` cannot express custom properties, and an `as CSSProperties` cast also silences misspelled variable names. The hook list lives in `theme/componentVars.ts` with a conformance test that fails if it and the extracted CSS disagree in either direction.

Public API surface and pre-1.0 breaking-change rules: [API_POLICY.md](API_POLICY.md).

## Cascade order

Silk's rules are all single-class specificity, and variants use `:where([data-…])` to stay there. Against a consumer's `className` that is a tie, so stylesheet order decides — and order is an artifact of the bundler's module graph, not something a consumer controls. In practice the consumer usually wins (their extracted CSS is registered after the `@reactive/silk` import that pulled in the component), but "usually" is not a contract.

Two stylesheets ship for this reason:

| Entry | Behavior |
| --- | --- |
| `@reactive/silk/styles.css` | Unlayered. Silk's rules compete with consumer rules on specificity and order. |
| `@reactive/silk/styles.layer.css` | Identical rules wrapped in `@layer silk`. Any unlayered consumer rule wins outright, whatever its specificity or position. |

The layered entry is opt-in because it also loses to unlayered consumer resets — a global `button { border: none }` that Silk currently outranks would start winning. Consumers who adopt it should layer their reset too and declare the order (`@layer reset, silk;`). Generated by `scripts/emit-layer-css.mjs` as a post-build step; it refuses to wrap a stylesheet containing `@import` or `@charset`, which may not appear inside a layer block.

## Distribution

- **Primitives & tokens:** npm packages (`@reactive/silk-core`, `@reactive/silk`)
- **Composites:** also distributed as source via the shadcn registry protocol (`registry.json`). Policy: installable items are published from release tags (not `main`) and pin compatible `@reactive/silk` versions. The current scaffold is unpinned because nothing is published yet — pinning lands with the first release.

## Hard constraints

- No Tailwind, no CVA, no utility-class composition
- Linaria static extraction; no runtime-generated CSS (constant SSR `<style>` from bindings OK)
- SSR-first (Anansi-compatible); no hydration theme hacks
- Floating surface + motion conventions: `packages/silk/src/components/floatingSurface.ts`
- Stage 3 public API: [STAGE3_API_MATRIX.md](STAGE3_API_MATRIX.md); perf budgets: `perf-budgets.json` / `yarn test:perf`
- Accessibility behavior from Radix whenever possible
- Responsive layout stays out of `silk-core` recipes