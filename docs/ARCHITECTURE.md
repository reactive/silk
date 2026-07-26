# Silk Architecture

Silk is a long-lived design system foundation. It is **not** a Tailwind/shadcn component dump. Radix owns behavior; Silk owns visuals, APIs, and theming.

This document describes how the system is built today. The _why_ — goals, constraints, and drift guards — is [PRINCIPLES.md](PRINCIPLES.md); the staged build-out plan is [ROADMAP.md](ROADMAP.md).

## Package boundaries

```text
@reactive/silk-core     platform-neutral tokens, createTheme, recipe contracts
        ↓
@reactive/silk          web renderer (Radix + Linaria + CSS variables)
        ↓ (later)
@reactive/silk-native   React Native renderer consuming the same core
```

Subpaths on core: `@reactive/silk-core`, `/tokens`, `/theme`, `/recipes`, `/models`.

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

| Path             | Mechanism                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Named light/dark | Static CSS + `data-theme` / `color-scheme` (and `prefers-color-scheme` when unset)                                                                                                                                                   |
| Dynamic / tenant | `themeToCssVars(theme)` on the ThemeProvider `style` attribute                                                                                                                                                                       |
| Nesting          | Secondary. Works via DOM variable inheritance in normal flow. Portals reconstitute the nearest ThemeProvider scope (class + `data-theme` + custom CSS vars); pass Dialog `container` when the portal DOM must live inside a subtree. |

Prefer either `theme` (custom object) or `colorScheme` (named/static). If both are passed, `theme` wins for `data-theme` and inline variables. Nested providers inherit omitted `colorScheme` / `density` from the nearest ancestor.

No runtime CSS-in-JS. No ad hoc `<style>` injection per provider. Constant SSR-rendered `<style>` from behavior bindings (Radix ScrollArea Viewport) is allowed when static and nonce-compatible — see PRINCIPLES amendment 2026-07-26.

### Density

System-level density remaps effective space tokens without renaming steps:

| Scale       | Source vars                                                                 | When active                |
| ----------- | --------------------------------------------------------------------------- | -------------------------- |
| Comfortable | `--silk-space-comfortable-*` (from `theme.semantic.space` / `defaultSpace`) | Default effective aliases  |
| Compact     | `--silk-space-compact-*` (from core `compactSpace`)                         | `[data-density='compact']` |

Effective `--silk-space-*` aliases are owned by `densityClass` (not `themeToCssVars`), so density remaps cannot be overridden by equal-specificity theme rules or inline custom-theme styles. `ThemeProvider` / `SilkProvider` `density` and per-component axes (e.g. Button) set `data-density` so the remap applies for that subtree. Components consume only effective vars — no per-component density padding tables.

### Responsive strategy (web-only)

**Intrinsic-first + container queries.** Layout primitives are fluid by design (`Inline` wraps, `Grid` `columns="auto"` auto-fills, `Container` max-width). There is no viewport breakpoint system and no responsive prop objects in core recipes.

| Concern                                     | Owner                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Fluid defaults                              | Layout components                                                                               |
| Container breakpoints (`xs`/`sm`/`md`/`lg`) | `@reactive/silk` only (`containerBreakpoints`)                                                  |
| Adaptive switch                             | Web-only `collapseBelow` on `Inline` → pre-generated `@container (width < Npx)` rules           |
| Size containment                            | `Container` always; `Box contain` opt-in                                                        |

Core recipes stay platform-neutral. Native does not implement container queries.

## Variants

Components render `data-*` attributes typed from recipes (`defineRecipe` in core). One Linaria `css` block per component styles them with `:where([data-…])` so specificity stays at single-class level — consumer `className` wins without `!important`.

Tone selectors assign private interaction variables; variant selectors decide how those variables are used (solid / soft / outline / ghost).

Recipes are **contracts** (variant unions + defaults). Web CSS interpolates recipe arrays at build time (proven by the Linaria cross-package spike). A conformance test asserts every declared value appears in extracted CSS.

## Layers

| Layer       | Examples                                                                                                                                    | Notes                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Layout      | `Box`, `Stack` (vertical), `Inline` (horizontal), `Grid`, `Container`, `Separator`                                                          | Spacing via CSS variables; responsive via container queries (web)                                                  |
| Visual      | `Text`, `Button`, `Avatar`, `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress`                                        | `Button` is the reference variant engine; `Surface` owns elevation                                                 |
| Interaction | `Dialog`, `Popover`, `Tooltip`, `DropdownMenu`, `Select`, `Tabs`, `Accordion`, `ScrollArea`, `Toast`, `Toggle`/`ToggleGroup`, form controls | Radix behavior, Silk visuals; floating surfaces share `floatingSurface` + Presence-compatible enter/exit keyframes |
| Forms       | `Field`, `Input`, `Textarea`                                                                                                                | Field owns id/`aria-*` wiring (single vs group modes)                                                              |
| Composite   | `Identity`, `MediaObject`, `ActionBar`, `StatGroup`, `EmptyState`, `PostCard`, `Comment`/`CommentThread`, `Notification`, `FeedItem`, `ProfileCard`, `SettingsPanel` | Dual API (compound-first + convenience); see [COMPOSITES.md](COMPOSITES.md)                                        |

Escape hatches on every component: `className`, `style`, `ref` (React 19 prop), data attributes, `asChild` where sensible.

### Layout axes

Flow direction is a property of the component, never a prop, so `align` and `justify` never change meaning at a call site:

| Component | Flow       | `align`                      | `justify`                        |
| --------- | ---------- | ---------------------------- | -------------------------------- |
| `Stack`   | vertical   | `align-items` (horizontal)   | `justify-content` (vertical)     |
| `Inline`  | horizontal | `align-items` (vertical)     | `justify-content` (horizontal)   |
| `Grid`    | tracks     | `align-items` (within track) | `justify-items` (within track)   |

`Grid` is the one exception to "`justify` distributes content": `columns` always emits `1fr` tracks, which consume the inline axis, so `justify-content` would have no free space to distribute. Pairing `justify` with the existing `align` as item placement is what a `columns`-based grid can actually act on.

`Inline collapseBelow` turns the row into a stretched column below the breakpoint. It overrides `align-items` but deliberately leaves `justify-content` alone, so a `justify` chosen for the row applies to the vertical axis once collapsed.

### Stacking

Portaled surfaces all mount to `document.body` (or a consumer `container`), so they are siblings in the root stacking context and raw `z-index` decides paint order. One scale owns it — `floatingZIndex` in `floatingSurface.ts`:

| Layer                 | Value |
| --------------------- | ----- |
| Dialog overlay        | 30    |
| Dialog content        | 35    |
| Popover               | 40    |
| DropdownMenu / Select | 45    |
| Tooltip               | 50    |
| Toast                 | 60    |

Dialog deliberately sits below the anchored surfaces: a Select, menu, popover, or tooltip opened from inside a dialog portals out as a sibling of the dialog panel and must still paint above it. Toasts stay above the modal layer.

## Customization levels

1. `createTheme(...)` — semantic theme
2. `SilkProvider` `defaults` — typed per-component defaults (no runtime component registry)
3. Component props — `variant` / `tone` / `size` / `density` / …
4. Escape hatches — public component CSS variables, `className`, `style`, slots/`asChild`

The escape hatches are **ranked, not interchangeable**. Split _what you target_ from _how you author it_:

| Reach for                                 | When                                                              | Why                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Public CSS variables (`--silk-button-bg`) | The component exposes a hook for what you want to change          | Order-independent by construction: the component only ever _reads_ the variable, so nothing competes with the consumer's declaration |
| `styled(Component)`                       | A reusable named component, or typed dynamic props → CSS vars     | Same build-time extraction as `css`; yields a component type consumers can import and compose                                        |
| `css` + `className` (compose with `cx`)   | Mixins shared across hosts, stacked independent classes, one-offs | No wrapper fiber; the right tool when the style is a class, not a new component                                                      |
| `style`                                   | Values only known at runtime (tenant color, computed dimension)   | Highest precedence, but the smallest expressive surface and a new object every render                                                |

`cssVars()` types the hooks for the `style` prop; React's `CSSProperties` cannot express custom properties, and an `as CSSProperties` cast also silences misspelled variable names. The hook list lives in `theme/componentVars.ts` with a conformance test that fails if it and the extracted CSS disagree in either direction.

### `asChild` with decorations

Many parts render a Silk-owned decoration next to `{children}` — a chevron, a caret, a shortcut, a required indicator. Radix's `Slot` needs exactly one child to slot onto, so those parts must wrap children in `Slot.Slottable`; the decoration is then appended inside the consumer's element instead of leaving `Slot` with no single target.

The wrap is **unconditional**, even where the decoration is conditional. Radix gates its single-child fallback on `Children.count(children) === 1`, and `Children.count` counts a `null` child, so `{children}{cond ? <span /> : null}` is two children and fails to slot whether or not the decoration renders. Do not "simplify" a `Slottable` to only apply when the decoration is present.

Where the decoration cannot be reordered — `Select.Item` wraps children in Radix's `ItemText`, so the consumer's element can never be both the item and the text source — `asChild` is omitted from the part's props (`Omit<…, 'asChild'>`) and the unsupported case becomes a compile error. `Checkbox`, `Switch`, `Slider`, `Progress`, and `RadioGroup` omit it for the same reason.

Public API surface and pre-1.0 breaking-change rules: [API_POLICY.md](API_POLICY.md).

## Cascade order

Silk's rules are all single-class specificity, and variants use `:where([data-…])` to stay there. Against a consumer's `className` that is a tie, so stylesheet order decides — and order is an artifact of the bundler's module graph, not something a consumer controls. In practice the consumer usually wins (their extracted CSS is registered after the `@reactive/silk` import that pulled in the component), but "usually" is not a contract.

Two stylesheets ship for this reason:

| Entry                             | Behavior                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@reactive/silk/styles.css`       | Unlayered. Silk's rules compete with consumer rules on specificity and order.                                              |
| `@reactive/silk/styles.layer.css` | Identical rules wrapped in `@layer silk`. Any unlayered consumer rule wins outright, whatever its specificity or position. |

The layered entry is opt-in because it also loses to unlayered consumer resets — a global `button { border: none }` that Silk currently outranks would start winning. Consumers who adopt it should layer their reset too and declare the order (`@layer reset, silk;`).

Generated by the `silk:layered-css` plugin in `packages/silk/rslib.config.ts`, so watch builds cannot leave it stale. The wrap is byte-identical (`packed-consumer-check.mjs` asserts the round trip), and it refuses to wrap a stylesheet containing `@import` or `@charset`, which may not appear inside a layer block.

## Distribution

- **Primitives & tokens:** npm packages (`@reactive/silk-core`, `@reactive/silk`)
- **Composites:** also distributed as source via the shadcn registry protocol (`registry.json`). Policy: installable items are published from release tags (not `main`) and pin compatible `@reactive/silk` versions. The current scaffold is unpinned because nothing is published yet — pinning lands with the first release.

## Hard constraints

- No Tailwind, no CVA, no utility-class composition
- Linaria static extraction; no runtime-generated CSS (constant SSR `<style>` from bindings OK)
- `@linaria/core` only in Silk's own implementation — no `@linaria/react` `styled`, for the Silk-scoped reasons in [PRINCIPLES.md](PRINCIPLES.md#current-bindings) (cross-platform variants, DOM-tag prop filtering, composition fit, forced download on every consumer, `isolatedDeclarations`). Enforced by the built-JS marker check in `scripts/packed-consumer-check.mjs`. Consumers are free to use `styled(Component)`; every component forwards `className`, and wrapping a component skips the DOM-tag prop filter.
- SSR-first (Anansi-compatible); no hydration theme hacks
- Floating surface + motion conventions: `packages/silk/src/components/floatingSurface.ts`
- Stage 3 public API: [STAGE3_API_MATRIX.md](STAGE3_API_MATRIX.md); perf budgets: `perf-budgets.json` / `yarn test:perf`
- Accessibility behavior from Radix whenever possible
- Responsive layout stays out of `silk-core` recipes
