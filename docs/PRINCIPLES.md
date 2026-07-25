# Silk Guiding Principles

This document is the **charter** for Silk. It exists so the project does not drift as the design evolves, constraints change, and new contributors (human or AI) join. [ARCHITECTURE.md](ARCHITECTURE.md) describes *how* the system is built today; this document describes *why*, and what must stay true.

**Rule of use:** any design decision, PR, or roadmap change that conflicts with this document must either be rejected or come with an explicit amendment to this document. Silent divergence is the failure mode we are guarding against.

## What Silk is

A **long-lived design system foundation** for applications — not another component library, and not a mirror of an existing one. Silk owns its own API. Think Radix + Material UI + Ant Design in *completeness*, with the architecture of a modern headless system.

Silk optimizes for, in order:

1. **Long-term maintainability** over initial implementation speed.
2. **Clear ownership boundaries** — Radix owns behavior; Silk owns visuals and APIs.
3. **Excellent SSR performance** — statically extracted CSS, minimal runtime work.
4. **A semantic, theme-driven architecture** — never component-specific one-off styling.
5. **Shared concepts across web and native** — without forcing identical implementations where the platforms naturally differ.
6. **First-class product components** (feeds, identity, comments, notifications) — not just low-level primitives.
7. **Developer ergonomics** — a clean, consistent API that is easy to customize and evolve over many years.

When two goals conflict, the lower number wins.

## Hard constraints (non-negotiable)

These are not preferences. Violating any of them is a bug regardless of how convenient the violation is.

- **No Tailwind. No CVA. No utility-class styling.** No runtime class-composition system built around utility classes. Using the shadcn **registry protocol** for distribution is fine; shipping Tailwind-flavored components through it is not.
- **CSS-first via Linaria.** CSS is statically extracted at build time. Runtime styling is limited to CSS variables. No runtime CSS-in-JS, no per-provider `<style>` injection.
- **SSR-first.** Everything renders correctly on the server (Anansi, not Next.js). No client-only architectures, no hydration hacks, no runtime style generation.
- **Radix owns behavior.** Never reinvent dialogs, menus, popovers, focus management, or keyboard interaction. Silk owns visuals and API shape on top.
- **Components never reference palette colors.** Only semantic tokens. The palette exists solely as raw material for themes.
- **The shared layer (`silk-core`) knows nothing about CSS, the DOM, or React Native views.** Tokens, themes, recipes, and contracts are platform-neutral data and types.

## Ownership boundaries

| Concern | Owner |
| --- | --- |
| Accessibility & interaction behavior | Radix (web) / platform equivalents (native) |
| Visual language, variants, theming | Silk |
| Component API shape | Silk (never mirrored from another library) |
| Tokens, recipes, contracts, types | `silk-core` (platform-neutral) |
| Rendering | Platform packages (`silk` web; `silk-native` later) |

## Theming is architectural, not a feature

Themeability is the most important requirement and must never become something bolted on.

- **Layering:** raw palette → semantic tokens (`surface`, `textPrimary`, `accent`, `danger`, `radius`, `spacing`, `motion`, `typography`, …) → sparse component tokens → platform delivery.
- **Web delivery is CSS variables** — enabling nested themes, runtime switching, server rendering, tenant branding, and minimal rerendering.
- **Native consumes the same semantic theme object** — structurally identical, delivered without CSS.
- **Component tokens stay sparse.** They exist as a public override surface (`--silk-button-bg`), not as a parallel token system. If a component needs many bespoke tokens, the semantic layer is missing a concept — fix the semantic layer.

## Cross-platform philosophy

The goal is **shared design language, not identical rendering**. Native should feel native; web should feel like the web.

- **Share:** design tokens, semantic tokens, variants, component APIs, types, state machines, business logic, interaction semantics, icons, composite models.
- **Keep platform-specific:** Dialog, Select, Tooltip, Popover, Menu, Toast, navigation, responsive layout.
- Never contort the shared layer to force pixel parity, and never let a platform package redefine tokens or variants locally.

## Component philosophy

Four distinct layers, each with a clear job:

1. **Layout primitives** (`Box`, `Stack`, `Inline`, `Grid`, `Center`, `Container`, `Separator`) — solve layout consistently.
2. **Visual primitives** (`Button`, `Card`, `Text`, `Input`, `Field`, `Skeleton`, …) — establish the visual language; where the variant engine lives.
3. **Interaction primitives** (`Dialog`, `Popover`, `Tabs`, `Select`, `Toast`, …) — Radix behavior, Silk visuals.
4. **Composites** (`Identity`, `PostCard`, `CommentThread`, `Notification`, `FeedItem`, `ProfileCard`, …) — where product value lives. Built **from Silk primitives, never from raw DOM**. These are first-class citizens, not examples.

## API philosophy

- Small orthogonal axes — `variant`, `tone`, `size`, `density`, `appearance` — never giant combinatorial variant names (`primaryLargeRoundedMarketingBlue`).
- Strongly typed, tree-shakeable, Linaria-friendly and React Native-friendly variant definitions (recipes as contracts in core).
- Avoid huge polymorphic APIs. Prefer composition (`asChild`, compound parts) over prop explosions.

## Customization ladder

Every component participates in all four levels; consumers must never feel trapped:

1. **Theme** — `createTheme(...)`
2. **Provider defaults** — typed per-component defaults on `SilkProvider`
3. **Component variants** — `variant` / `tone` / `size` / `density` / `appearance`
4. **Escape hatches** — `className` (web), `style`, `ref`, data attributes, public component CSS variables, slots / composition

Shipping a component without the escape-hatch level is a regression, not a simplification.

## Distribution

- **Primitives and tokens are npm packages.**
- **Composites are additionally distributed as source** via the shadcn registry protocol — zero Tailwind, zero utility classes, zero Tailwind assumptions in generated code. The registry distributes source; it does not impose architecture.

## Drift checklist

Questions to ask before merging anything significant. A "no" means stop.

- Does behavior still come from Radix (or a platform equivalent), with Silk only styling it?
- Is every color referenced through a semantic token?
- Does `silk-core` remain free of CSS, DOM, and React Native imports?
- Is all CSS statically extracted — would this render correctly on the server with JS disabled styles-wise?
- Do new props fit the existing axes (`variant`/`tone`/`size`/`density`/`appearance`) instead of inventing new ones?
- Are composites built from Silk primitives rather than raw elements?
- Are all four customization levels intact, including escape hatches?
- Would this decision still make sense in five years, or is it a shortcut for this quarter?

## Amending this document

Principles can change — deliberately. An amendment requires: the change itself, the reason, and the date, recorded below. If a proposal can't justify an amendment entry, it doesn't override the charter.

### Amendment log

- 2026-07 — Initial charter, distilled from the founding design brief.
