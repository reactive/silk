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
7. **Extensibility and flexibility** — the system grows by addition, and consumers can adapt or extend any layer without forking.
8. **Ergonomics for humans and agents** — a small, predictable vocabulary that any consumer, human or AI, can learn once and apply everywhere.

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
- **Interfaces converge even where implementations diverge.** For any concept that exists on both platforms, the contract — prop names, types, variant axes, event semantics, composition shape — should be as close to identical as platform reality allows, ideally a single definition in `silk-core` that both renderers implement. Rendering may differ freely; the API is part of the shared design language, so knowledge (and code, and agent priors) transfers across platforms. Each interface divergence is a cost that must be justified by a real platform difference, never by implementation convenience.
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

## Design heuristics

How to choose between designs that all satisfy the constraints. These exist because Silk's consumers and maintainers include AI agents as much as humans — and what serves one serves the other: a system that a model can use correctly from its prior knowledge is also a system a person can learn in an afternoon.

- **Spend concepts, not names.** The system has a concept budget. Every new concept — a prop axis, a token category, a naming pattern, a composition idiom — must be learned by everyone and everything that touches the system, and its cost multiplies across every component that adopts it. Prefer one powerful concept applied broadly (e.g. `tone` working identically on every component) over many narrow ones. Before introducing a new concept, prove an existing one can't be stretched to cover it. Cardinality, not code volume, is what makes systems unlearnable at scale.
- **Convention over invention.** When two designs are similarly good and similarly complex, choose the one that matches de facto ecosystem standards — names, prop shapes, and patterns common across comparable libraries (`asChild`, `size`, `onOpenChange`, compound `Root`/`Trigger`/`Content` parts, …). Familiar shapes are pre-learned: agents produce correct code from training priors, and humans guess right on the first try. This is strictly a **tiebreaker** — it never overrides a hard constraint or a genuinely better design, and "Silk owns its API" means we choose deliberately, not that we invent for novelty's sake.
- **Extension by addition.** Every layer must accept new members without rearchitecting: new semantic tokens, new recipes, new components, new themes, new platforms. The infrastructure Silk builds with — `defineRecipe`, `createTheme`, semantic tokens, the composition patterns — is public API, so downstream code can create components that are indistinguishable from first-party ones. If extending requires forking or patching, the boundary is drawn wrong.
- **Predictable beats clever.** APIs should be guessable from the rest of the system: consistent naming, behavior discoverable from types, and patterns that transfer between components. If knowing one component doesn't help you use the next, the design has failed this heuristic.

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
- Does this reuse an existing concept instead of adding a new one — and if it must be new, does it pay for itself across many components?
- Would someone (or a model) familiar with the rest of Silk and with comparable libraries guess this API correctly?
- Can downstream code extend this without forking or patching Silk?
- If this concept exists (or will exist) on both platforms, is the interface shared — and is any divergence justified by a real platform difference?
- Would this decision still make sense in five years, or is it a shortcut for this quarter?

## Amending this document

Principles can change — deliberately. An amendment requires: the change itself, the reason, and the date, recorded below. If a proposal can't justify an amendment entry, it doesn't override the charter.

### Amendment log

- 2026-07 — Initial charter, distilled from the founding design brief.
- 2026-07 — Added goals 7–8 (extensibility/flexibility, human-and-agent ergonomics) and the **Design heuristics** section: concept budget, convention-over-invention tiebreaker, extension by addition, predictability. Reason: Silk is consumed and maintained by AI agents as well as humans; concept cardinality and departure from ecosystem conventions are the main scaling costs for both.
- 2026-07 — Cross-platform: interfaces converge even where implementations diverge. Shared concepts get one contract (ideally defined in `silk-core`); API divergence between web and native requires a real platform justification.
