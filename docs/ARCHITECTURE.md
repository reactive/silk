# Silk Architecture

Silk is a long-lived design system foundation. It is **not** a Tailwind/shadcn component dump. Radix owns behavior; Silk owns visuals, APIs, and theming.

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

Prefer either `theme` (custom object) or `colorScheme` (named/static). If both are passed, `theme` wins for `data-theme` and inline variables.

No runtime CSS-in-JS. No ad hoc `<style>` injection per provider.

## Variants

Components render `data-*` attributes typed from recipes (`defineRecipe` in core). One Linaria `css` block per component styles them with `:where([data-…])` so specificity stays at single-class level — consumer `className` wins without `!important`.

Tone selectors assign private interaction variables; variant selectors decide how those variables are used (solid / soft / outline / ghost).

Recipes are **contracts** (variant unions + defaults). Web CSS interpolates recipe arrays at build time (proven by the Linaria cross-package spike). A conformance test asserts every declared value appears in extracted CSS.

## Layers

| Layer | Examples | Notes |
| --- | --- | --- |
| Layout | `Box`, `Stack` | Spacing via CSS variables |
| Visual | `Text`, `Button`, `Avatar` | `Button` is the reference variant engine |
| Interaction | `Dialog` | Radix behavior, Silk visuals |
| Composite | `Identity` | Compound parts + convenience props |

Escape hatches on every component: `className`, `style`, `ref` (React 19 prop), data attributes, `asChild` where sensible.

## Customization levels

1. `createTheme(...)` — semantic theme
2. `SilkProvider` `defaults` — typed per-component defaults (no runtime component registry)
3. Component props — `variant` / `tone` / `size` / `density` / …
4. Escape hatches — className, style, public component CSS variables, slots/`asChild`

## Distribution

- **Primitives & tokens:** npm packages (`@reactive/silk-core`, `@reactive/silk`)
- **Composites:** also distributed as source via the shadcn registry protocol (`registry.json`). Items pin compatible `@reactive/silk` versions. Publish installable items from release tags, not `main`.

## Hard constraints

- No Tailwind, no CVA, no utility-class composition
- Linaria static extraction only
- SSR-first (Anansi-compatible); no hydration theme hacks
- Accessibility behavior from Radix whenever possible
