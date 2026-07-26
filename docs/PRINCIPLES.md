# Silk Guiding Principles

This document is the **charter** for Silk. It exists so the project does not drift as the design evolves, constraints change, and new contributors (human or AI) join. [ARCHITECTURE.md](ARCHITECTURE.md) describes _how_ the system is built today; this document describes _why_, and what must stay true.

**Rule of use:** any design decision, PR, or roadmap change that conflicts with this document must either be rejected or come with an explicit amendment to this document. Silent divergence is the failure mode we are guarding against.

## What Silk is

A **long-lived design system foundation** for applications — not another component library, and not a mirror of an existing one. Silk owns its own API. Think Radix + Material UI + Ant Design in _completeness_, with the architecture of a modern headless system.

Silk optimizes for, in order:

1. **Long-term maintainability** over initial implementation speed.
2. **Clear ownership boundaries** — interaction behavior is delegated to proven primitives (Radix on web); Silk owns visuals, APIs, and end-to-end accessibility.
3. **Excellent SSR performance** — statically extracted CSS, minimal runtime work.
4. **A semantic, theme-driven architecture** — never component-specific one-off styling.
5. **Shared concepts across web and native** — without forcing identical implementations where the platforms naturally differ.
6. **First-class product components** (feeds, identity, comments, notifications) — not just low-level primitives.
7. **Extensibility and flexibility** — the system grows by addition, and consumers can adapt or extend any layer without forking.
8. **Ergonomics for humans and agents** — a small, predictable vocabulary that any consumer, human or AI, can learn once and apply everywhere.

When two goals conflict, the lower number wins.

## Invariants and bindings

The non-negotiables are **outcomes** (invariants), not tools. Tools are **bindings** — the current best implementation of an invariant — and are replaceable when their health degrades. Confusing the two is how a "long-lived" system dies with its dependencies. Invariants outrank every numbered goal above.

### Invariants (non-negotiable)

Violating any of these is a bug regardless of how convenient the violation is.

- **No utility-class styling.** No Tailwind, no CVA, no runtime class-composition systems. Distributing source via a registry _protocol_ is fine; shipping utility-class-flavored content through it is not.
- **No runtime-generated CSS.** Styling is extracted at build time; runtime styling is limited to CSS variables. Constant, SSR-rendered `<style>` content from behavior bindings is permitted when it is static, tiny, and CSP-nonce-compatible (e.g. Radix ScrollArea’s scrollbar-hiding rule). Forbidden: runtime CSS-in-JS, per-provider style injection, and any style whose content is computed per render or per theme.
- **SSR-first.** Everything renders correctly on the server. No client-only architectures, no hydration hacks, no runtime style generation.
- **Interaction mechanics are delegated, never reimplemented.** Focus management, keyboard interaction, overlay and dismissal semantics come from a proven, accessible behavior source. Silk owns visuals and API shape on top — and owns the end-to-end accessibility of the result (see ownership boundaries).
- **Components never reference palette colors.** Only semantic tokens. The palette exists solely as raw material for themes.
- **The shared layer (`silk-core`) knows nothing about CSS, the DOM, or React Native views.** Tokens, themes, recipes, and contracts are platform-neutral data and types.

### Current bindings

| Invariant                            | Current binding                                         |
| ------------------------------------ | ------------------------------------------------------- |
| Static CSS extraction                | Linaria                                                 |
| Interaction behavior source (web)    | Radix Primitives                                        |
| Interaction behavior source (native) | OS behaviors + vetted native-backed libraries (Stage 6) |
| SSR host                             | Anansi                                                  |
| Source distribution                  | shadcn registry protocol                                |

Bindings are commitments, not identity. Replacing one requires a charter amendment naming the trigger (maintenance stalled, security, platform incompatibility, or a strictly better implementation of the same invariant), the migration path, and its owner — and the invariants survive the replacement unchanged. Watch dependency health deliberately rather than discovering it in a crisis.

**Linaria means `@linaria/core` only — as what Silk ships.** `@linaria/react`'s `styled` is excluded from Silk's own implementation, and _not_ because it generates CSS at runtime — it does not. A spike confirmed it extracts to ordinary static classes and compiles dynamic interpolations to CSS custom properties applied via `style`, which the runtime-styling invariant explicitly permits. Silk does not take the dependency for reasons that apply to _shipping it as a library_, not to consumers who already use it:

1. **Cross-platform.** `styled`'s idiom is prop interpolation, which is web-only. Silk's variants come from `data-*` attributes typed by `silk-core` recipes precisely so native can implement the same contracts. Adopting `styled` internally would split the variant system into two incompatible halves.
2. **Prop filtering.** `styled` on a DOM tag drops props that are not recognized as valid HTML/SVG attributes. Silk's targets are DOM tags and depend on exact `data-*` and ARIA passthrough, so that filtering would apply.
3. **Composition.** Silk components resolve provider defaults, emit `data-*`, and wire Radix `asChild`/`Slot` by hand. `styled` supplies "element plus static class", so it adds a wrapper layer rather than replacing one.
4. **Forced download.** Shipping `@linaria/react` would put its wrapper runtime (~2.9 KB gzip; `css` + `cx` alone is ~0.35 KB) on _every_ Silk consumer, including those who never write `styled`. That is a library-authoring cost, not a cost of consumer use — a consumer who already depends on `@linaria/react` pays zero marginal bytes.
5. **Declaration emit.** Silk's `dts` build enables `isolatedDeclarations`; `styled` fails TS9010 on every export unless each component's type is written by hand. Consumer apps do not emit declarations, so they never hit this.

Per render, a `styled` component clones its props (`Object.keys` + filter + a new object), runs `cx`, and mounts one extra `forwardRef` fiber. Dynamic interpolations also allocate a style object and call each interpolation. What it never does is generate, serialize, hash, or inject CSS — the costly part of runtime CSS-in-JS, and the part Linaria does not have.

Consumers should prefer **`styled(Component)`** when they want a reusable named component or typed dynamic props that compile to CSS variables. Prefer **`css` + `className`** (and `cx` to compose) when the style is a mixin applied to several hosts, when you are stacking independent classes, or when a one-off class does not justify a wrapper fiber. Every Silk component forwards `className`; wrapping a component with `styled` skips the DOM-tag prop filter. Silk neither ships `@linaria/react` nor requires it.

## Ownership boundaries

| Concern                                                                                                | Owner                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Primitive interaction mechanics (focus, keyboard, overlays, dismissal)                                 | Radix (web) / OS + vetted native-backed libraries (native)   |
| End-to-end accessibility (accessible names, labels, contrast, composite semantics, motion preferences) | Silk — delegating mechanics does not delegate responsibility |
| Visual language, variants, theming                                                                     | Silk                                                         |
| Component API shape                                                                                    | Silk (never mirrored from another library)                   |
| Tokens, recipes, contracts, types                                                                      | `silk-core` (platform-neutral)                               |
| Rendering                                                                                              | Platform packages (`silk` web; `silk-native` later)          |

## Theming is architectural, not a feature

Themeability ranks where the goals list puts it — the claim is not that it outranks everything, but that it **cannot be retrofitted**: get the token/theme architecture wrong early and every later component inherits the mistake. So it must be built and validated first, never bolted on.

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
4. **Composites** (`Identity`, `PostCard`, `CommentThread`, `Notification`, `FeedItem`, `ProfileCard`, …) — where product value lives. Silk primitives supply **all styling and shared behavior** — composites never carry bespoke CSS or hand-rolled interaction. Semantic HTML (`article`, `time`, headings, lists) is encouraged where it carries meaning; what's forbidden is styling or behavior smuggled in through raw elements, not the elements themselves. Judge composites by their rendered output semantics, not their component ancestry. These are first-class citizens, not examples.

## API philosophy

- Small orthogonal axes — `variant`, `tone`, `size`, `density`, `appearance` — never giant combinatorial variant names (`primaryLargeRoundedMarketingBlue`).
- Strongly typed, tree-shakeable, Linaria-friendly and React Native-friendly variant definitions (recipes as contracts in core).
- Avoid huge polymorphic APIs. Prefer composition (`asChild`, compound parts) over prop explosions.

## Design heuristics

How to choose between designs that all satisfy the constraints. These exist because Silk's consumers and maintainers include AI agents as much as humans — and what serves one serves the other: a system that a model can use correctly from its prior knowledge is also a system a person can learn in an afternoon.

- **Spend concepts, not names.** The system has a concept budget. Every new concept — a prop axis, a token category, a naming pattern, a composition idiom — must be learned by everyone and everything that touches the system, and its cost multiplies across every component that adopts it. Prefer one powerful concept applied broadly (e.g. `tone` working identically on every component) over many narrow ones. Before introducing a new concept, prove an existing one can't be stretched to cover it. Cardinality, not code volume, is what makes systems unlearnable at scale.
- **Convention over invention.** When two designs are similarly good and similarly complex, choose the one that matches de facto ecosystem standards — names, prop shapes, and patterns common across comparable libraries (`asChild`, `size`, `onOpenChange`, compound `Root`/`Trigger`/`Content` parts, …). Familiar shapes are pre-learned: agents produce correct code from training priors, and humans guess right on the first try. This is strictly a **tiebreaker** — it never overrides an invariant or a genuinely better design, and "Silk owns its API" means we choose deliberately, not that we invent for novelty's sake.
- **Extension by addition.** Every layer must accept new members without rearchitecting: new semantic tokens, new recipes, new components, new themes, new platforms. The infrastructure Silk builds with — `defineRecipe`, `createTheme`, semantic tokens, the composition patterns — is public API, so downstream code can create components that are indistinguishable from first-party ones. If extending requires forking or patching, the boundary is drawn wrong.
- **Predictable beats clever.** APIs should be guessable from the rest of the system: consistent naming, behavior discoverable from types, and patterns that transfer between components. If knowing one component doesn't help you use the next, the design has failed this heuristic.
- **Intent at the surface, resolution underneath.** A usage site should expose every design decision made _there_ — layout, spacing, color role, hierarchy — as semantic declarations, and nothing else. Concerns orthogonal to the usage site (exact palette values, light/dark mode, tenant theme, platform delivery) live behind layers of indirection and never leak into component code, so a reader reasons about what varies at this site without parsing what doesn't. The indirection must stay traversable: when the deeper layer _is_ the concern, following it should be one well-named hop (token → theme entry), not an opaque lookup. Semantic color is the canonical case — `tone="danger"` states the complete design intent at the call site; which red that resolves to in dark mode is a theme-layer question, answered in the theme layer. This is also why **themes may change values but never meaning**. Invariant across every theme and mode: role mapping (`tone="danger"` always resolves to the danger role), distinguishability of states (hover / focus / disabled stay visibly distinct), relative hierarchy (primary emphasis stays above secondary), and contrast floors. Free to vary: the actual colors, radii, typefaces, and spacing values. The layers only stay separable if each one keeps its contract.

## Customization ladder

Every component participates in all four levels; consumers must never feel trapped:

1. **Theme** — `createTheme(...)`
2. **Provider defaults** — typed per-component defaults on `SilkProvider`
3. **Component variants** — `variant` / `tone` / `size` / `density` / `appearance`
4. **Escape hatches** — public component CSS variables, `className` (web), `style`, `ref`, data attributes, slots / composition

Shipping a component without the escape-hatch level is a regression, not a simplification.

The escape hatches are ranked, and the ranking is part of the design: **public CSS variables** first (order-independent, and the only hatch the component actively cooperates with), then a **statically extracted class** applied via `styled(Component)` or `css` + `className` (build-time, expressive enough for state and media selectors), then **`style`** (runtime values only). Prefer `styled` for reusable named components; prefer `css` + `cx` when composing mixins across hosts. A system whose documented override path is inline `style` has quietly conceded that its cascade contract does not hold — so the escape hatch a consumer reaches for first is a measure of whether levels 1–3 are doing their job. See ARCHITECTURE for the cascade-order guarantees behind the ranking.

## Distribution

- **Primitives and tokens are npm packages.**
- **Composites are additionally distributed as source** via the shadcn registry protocol — zero Tailwind, zero utility classes, zero Tailwind assumptions in generated code. The registry distributes source; it does not impose architecture.

## Drift checklist

Questions to ask before merging anything significant. A "no" means stop.

- Does interaction behavior still come from the platform's behavior binding (Radix on web), with Silk styling it and owning the accessibility of the result?
- Is every color referenced through a semantic token?
- Does `silk-core` remain free of CSS, DOM, and React Native imports?
- Is CSS free of runtime generation — would this render correctly on the server with JS disabled styles-wise? (Constant SSR `<style>` from a behavior binding is OK; dynamic style content is not.)
- Do new props fit the existing axes (`variant`/`tone`/`size`/`density`/`appearance`) instead of inventing new ones?
- Do composites take all styling and shared behavior from Silk primitives, while keeping semantically correct output markup?
- Are all four customization levels intact, including escape hatches?
- Does this reuse an existing concept instead of adding a new one — and if it must be new, does it pay for itself across many components?
- Would someone (or a model) familiar with the rest of Silk and with comparable libraries guess this API correctly?
- Can downstream code extend this without forking or patching Silk?
- If this concept exists (or will exist) on both platforms, is the interface shared — and is any divergence justified by a real platform difference?
- Does the usage site state its design decisions semantically, with no theme, mode, or platform details leaking in — and is each layer underneath still one discoverable hop away?
- Would this decision still make sense in five years, or is it a shortcut for this quarter?

## Amending this document

Principles can change — deliberately. An amendment requires: the change itself, the reason, and the date, recorded below. If a proposal can't justify an amendment entry, it doesn't override the charter.

### Amendment log

- 2026-07-26 — **Corrected the `styled` cost framing.** The prior entry bundled ~2.9 KB gzip and `isolatedDeclarations` (TS9010) as general "cost" against `styled`; both are library-authoring constraints (Silk shipping the dep imposes bytes on every consumer; Silk's `dts` emit hits TS9010), not consumer costs. A consumer who already uses `@linaria/react` pays zero marginal bytes and never emits declarations. Per-render cost is a props clone plus one wrapper fiber — no stylesheet generation, serialization, or injection. The exclusion from Silk's implementation stands; the claim that consumer `styled(Button)` is "not lighter or more capable than `css` + `className`" does not.
- 2026-07-26 — Recorded **why `@linaria/react`'s `styled` is excluded**, replacing the implicit assumption that it violated the runtime-CSS invariant. A spike showed it extracts static classes and uses CSS variables for dynamic values, which the invariant permits; the real grounds are cross-platform variant sharing, prop filtering, composition fit, and cost (measured ~2.9 KB gzip runtime, plus `isolatedDeclarations` failures). Reason: a guard defended by a wrong reason is a guard that loses the next argument. Also deleted a dead `expect(html).not.toContain('styled(')` SSR assertion that could never fail; the built-JS marker check in `packed-consumer-check.mjs` is the real guard.
- 2026-07-26 — **Escape hatches are ranked** (public CSS variables → `className` with an extracted class → `style` for runtime values only), and the cascade contract behind the ranking is now explicit: an optional `@reactive/silk/styles.layer.css` wraps the same rules in `@layer silk` so unlayered consumer CSS wins deterministically. Reason: `:where([data-…])` keeps variants at single-class specificity, but that only makes a consumer class a _tie_ with Silk's base rules — the winner was decided by bundler module order. Documenting `className` and `style` as equals pushed consumers toward `style`, the least expressive hatch, for overrides Linaria handles better. The layered stylesheet stays opt-in because it also loses to unlayered consumer resets.
- 2026-07-26 — Restated the static-CSS invariant as **outcomes**: no runtime-_generated_ CSS, SSR-correct output, CSS-variable theming. Explicitly permits constant, SSR-rendered `<style>` content from behavior bindings when static, tiny, and nonce-compatible (Stage 3 ScrollArea / Radix Viewport). Reason: the prior letter banned all `<style>` injection and would have forced a weaker native-scrollbar ScrollArea; the goals (SSR correctness, performance) hold without that strictness.
- 2026-07 — Initial charter, distilled from the founding design brief.
- 2026-07 — Added goals 7–8 (extensibility/flexibility, human-and-agent ergonomics) and the **Design heuristics** section: concept budget, convention-over-invention tiebreaker, extension by addition, predictability. Reason: Silk is consumed and maintained by AI agents as well as humans; concept cardinality and departure from ecosystem conventions are the main scaling costs for both.
- 2026-07 — Cross-platform: interfaces converge even where implementations diverge. Shared concepts get one contract (ideally defined in `silk-core`); API divergence between web and native requires a real platform justification.
- 2026-07 — Design heuristics: intent at the surface, resolution underneath. Usage sites carry complete semantic design intent; orthogonal concerns (theme values, color scheme, platform delivery) stay behind traversable indirection. Reason: readers — especially agents — reason best when the signal they need is local and the concerns they don't need are separated but discoverable.
- 2026-07 — Post adversarial review: (a) hard constraints split into **invariants** (outcomes) and **bindings** (current tools: Linaria, Radix, Anansi, shadcn registry protocol) with a replacement policy, so goal 1 (maintainability) survives dependency failure; (b) themeability wording corrected — the goals ordering is authoritative; theming's special status is that it cannot be retrofitted, not that it outranks all; (c) accessibility ownership corrected — Silk owns end-to-end accessibility and delegates only primitive interaction mechanics.
- 2026-07 — Post adversarial review, round two: (a) composites' "never raw DOM" replaced with an output-semantics rule — Silk primitives own all styling and shared behavior, while semantic HTML is encouraged where it carries meaning, because the old rule incentivized meaningless `Box` wrappers over `article`/`time`/headings; (b) theme contract made falsifiable — themes change values, never meaning: role mapping, state distinguishability, relative hierarchy, and contrast floors are invariant; concrete values are theme-variable.
