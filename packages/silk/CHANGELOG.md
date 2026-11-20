# @reactive/silk

## 0.1.0

### Minor Changes

- 2b03511: Add a `footer` slot to `Comment` for a trailing affordance that belongs to the comment rather than to its replies. It renders in the content column after the replies and outside their rail.

  `CommentThread` now routes its "Continue thread" button there. It previously went through the `replies` slot, which always wraps its content in a railed reply stack, so a comment at `maxDepth` with nothing nested inline drew a reply rail beside a lone button.

- b4fd11a: Cowork-inspired font defaults: first-class `sans` / `serif` / `mono` families.

  **breaking:**

  - `TypographyRecord.family` is now a `FontFamilyName` (`'sans' | 'serif' | 'mono'`) instead of a raw CSS `font-family` stack.
  - `SemanticTokens` gains required `fontFamily: Record<FontFamilyName, string>` (CSS stacks). Exhaustive `Record` / merge helpers must include it.
  - Default stacks lead with Inter / Source Serif 4 / JetBrains Mono (plus system fallbacks). Only `headingXl` (display / page H1) uses `serif`; section/panel `headingLg` and other roles stay `sans`.
  - Web CSS emits `--silk-font-sans`, `--silk-font-serif`, `--silk-font-mono`; role vars are indirect (`--silk-typography-*-family: var(--silk-font-…)`).

  Silk still ships no font files — load the faces yourself or fall through to system. Override via `createTheme({ semantic: { fontFamily: { sans: '…' } } })` or the `--silk-font-*` CSS variables.

- 2c7c49f: Rank the escape hatches and make the cascade contract explicit.

  - New `@reactive/silk/styles.layer.css` entry ships the extracted stylesheet wrapped in `@layer silk`, so unlayered consumer CSS overrides Silk deterministically instead of depending on bundler stylesheet order. The unlayered `styles.css` is unchanged and still the default, since the layered build also loses to unlayered consumer resets.
  - New `cssVars()` helper types the public component hooks for the `style` prop, replacing the `as CSSProperties` cast that custom properties otherwise require (and that silences misspelled variable names). `silkComponentVarNames` exports the hook list, guarded by a conformance test against the extracted CSS.
  - `--silk-scrollarea-thumb` now follows the same `var(hook, fallback)` pattern as every other hook. It was previously assigned on the ScrollArea root, which shadowed consumer overrides of equal specificity.

- 09d876d: Foundation release: platform-neutral tokens/theme/recipes in `@reactive/silk-core`, web renderer with Linaria + Radix exemplars (Box, Stack, Text, Button, Avatar, Dialog, Identity), ThemeProvider/SilkProvider, and registry scaffold.
- 3bf1155: Layout flow direction is a property of the component, never a prop: `Stack` is vertical, `Inline` is horizontal, and neither can flip its axis.

  A `direction` prop would mean the same `align`/`justify` values silently swap visual axis per call site. Fixing the axis per component — rather than renaming the props — keeps the standard flexbox reading of `align` and `justify` correct everywhere.

  - **`Stack` is vertical-only.** `stackRecipe.variants` is exactly `gap`, `align`, `justify`, `rail`. Reach for `Inline` for horizontal flow; it additionally carries `wrap`, `direction` (`row | row-reverse`, order rather than axis), and the web-only `collapseBelow`.
  - **Choosing between them:** vertical is `Stack`, horizontal is `Inline`. Their defaults differ deliberately — `Stack` is `align="stretch"`, `Inline` is `align="center"` and `wrap="wrap"` — so set `align`/`wrap` explicitly when a row must stretch to equal heights or must not reflow.
  - **Centering** is `align`/`justify` set to `"center"`. `Container` owns max-width measure centering (`margin-inline: auto` + `max-width`).
  - **`Grid` has `justify`** (`start | center | end | stretch`, default `stretch`) mapped to `justify-items`, pairing with `align` → `align-items`: `columns` always emits `1fr` tracks, so there is no free space for `justify-content` to distribute. On `Stack` and `Inline`, `justify` is `justify-content`.

- 7b6407b: Stage 1 layout system: `Inline`, `Grid`, `Container`, `Separator`, and `Box` padding; system density via `compactSpace` + `data-density` space remaps; web-only `collapseBelow` container queries; ThemeProvider density / nested theme inheritance.
- 338fe46: Stage 2 visual primitives and forms foundation.

  **breaking:**

  - `ToneName`: add `success` to every exhaustive `Record<ToneName, …>` / switch.
  - `InteractionToneColors`: add required `text`, `subtleHover`, and `subtleActive` (old soft/outline/ghost remaps of `border`/`hover` are gone — use the new slots).
  - `SemanticTokens`: add `color.surfaceSunken`, `color.overlay`, `shadow.{raised,overlay}`, and `focusRing.{width,offset}`; typography adds `headingSm` / `headingXl`.
  - Light solid fills use palette step 11 (was 9) so `onSolid: #fff` meets WCAG 4.5:1.
  - `createSharedSemanticScales()` is removed — use the `sharedSemanticScales` constant.
  - `MotionName` adds `loop` (1200ms, linear) for continuous indeterminate motion; `fast`/`normal`/`slow` stay one-shot transition durations. Exhaustive `Record<MotionName, …>` literals must add `loop`.
  - Tone `hover` / `active` are now three distinct fills alongside `solid` in both schemes. Light `hover` is blended between palette steps 11 and 12 rather than being step 12 (which collided with `active`), and neutral `active` is step 11 rather than step 12 (which collided with `solid`). Themes that hardcoded those hex values must re-derive them.
  - `FieldContextValue` drops `controlId`; `inputId` is now the single resolved control id. `Field.Root` gains `controlId` for naming that control — setting `id` on the control itself no longer retargets Label `htmlFor`, which previously required a post-hydration effect and produced a dangling `for=` on the server.

  Adds `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`; settings-form fixture; contrast and theming acceptance tests.

- 2c7c49f: Stage 3 interaction primitives: Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, ScrollArea, Toast, Toggle/ToggleGroup — shared floating-surface motion, recipes, portal theme reconstitution, InspectorPanel fixture, and CI performance budgets.
- 3bf1155: Stage 4 composites: product components, serializable models, and composition standard.

  - Add `@reactive/silk-core/models` (Identity/Stat/Media/Post/Comment/Notification/Profile/FeedEntry) and composite recipes.
  - Close primitive gaps: Card/Surface `interactive` hover elevation, Inline `direction`, Stack `rail`, `StatusDot`.
  - Ship composites: MediaObject, ActionBar, StatGroup, EmptyState, PostCard, Comment, CommentThread, Notification, FeedItem, ProfileCard, SettingsPanel.
  - Document the compound-first dual API in `docs/COMPOSITES.md`.
  - Retrofit Identity onto Inline (additive `model` prop — non-breaking).
  - SocialFeed exit fixture; registry sync script emits consumer-owned composite source.

- e2aa5b9: Stage 5 theming maturity (web): portal variable channels and re-exports.

  - Split theme-scope CSS vars into `semanticVars` (replaced by nested `theme`/`colorScheme`) and `customVars` (component hooks that inherit through named children into portals).
  - Re-export `generateScale`, `generatePairedPalette`, `checkThemeContrast`, and related types from `@reactive/silk`.
  - Document the frozen public component CSS-variable list via `silkComponentVarMeta` / `formatComponentVarDocsTable`.

### Patch Changes

- 2c7c49f: Fix `asChild` on every part that renders a decoration alongside its children. `Select.Trigger`, `Accordion.Trigger`, `DropdownMenu.SubTrigger`, `DropdownMenu.Item`, and `Field.Label` each threw "Primitive.\* failed to slot onto its children" because the chevron / caret / shortcut / required indicator was a second slot child. Their children are now wrapped in `Slot.Slottable`, so a custom element receives its own children plus the appended decoration. This applies even where the decoration is conditional (`DropdownMenu.Item shortcut`, `Field.Label` on a required field) — the `null` branch counted as a second child, so those parts threw on `asChild` regardless. The default (non-`asChild`) render path is unchanged.

  Two assembled parts cannot support `asChild` at all, and now say so at the type level instead of throwing at runtime: `asChild` is omitted from `SelectItemProps` and `SelectContentProps`, matching `Checkbox`, `Switch`, `Slider`, `RadioGroup`, and `Progress`. `Select.Item` wraps children in `RadixSelect.ItemText`, and `Slottable` substitutes the consumer's children unwrapped, so no arrangement yields "consumer element is the item, containing indicator + `ItemText`". `Select.Content` assembles a Viewport plus both scroll buttons, so there is likewise no single slot target.

  The rule and its `null`-branch pitfall are documented once in [ARCHITECTURE.md](../docs/ARCHITECTURE.md#aschild-with-decorations).

- 2b03511: Keep `Field.Root orientation="horizontal"` correct when slots sit inside a layout wrapper. The grid pinned only direct `Field.Label` / `Description` / `Error` children to column 2, so a `Stack` or `Inline` around the description auto-placed into the control column — even though Field already treats those wrappers as transparent when wiring `aria-describedby`. Wrappers holding a slot are now pinned too, and the label owns row 1 so the control stays beside it regardless of child order.
- 338fe46: Only wire `aria-labelledby` from Field context when a `Field.Label` is actually rendered, and point it at the label's own id. A `Slider` in a label-less `Field.Root` no longer gets a dangling `aria-labelledby`, so its `aria-label` names the `role="slider"` thumb again.

  Detect `Field.Label` / `Description` / `Error` among descendants (not only direct children) so layout wrappers like `Inline` / `Stack` still populate `aria-labelledby` / `aria-describedby`. Nested `Field.Root` boundaries are respected.

- 338fe46: `Slider` inside a single-mode `Field.Root` no longer gets a dangling or non-functional Label `htmlFor`. Field detects labelledby-marked controls (`fieldLabelAssociation`), omits automatic `htmlFor` / control `id`, and keeps naming on the thumb via `aria-labelledby`. Explicit `id` / `htmlFor` still win.

  `Field.Root required` still shows the label indicator for Slider fields; `required` / `aria-required` are not forwarded onto the thumb because range / `role="slider"` always has a value and does not support those attributes.

- 2c7c49f: Dialog overlay and content now draw their `z-index` from the shared floating stacking scale, so page content with a modest `z-index` (sticky headers, app chrome) no longer paints over the scrim or the panel. The overlay previously had no `z-index` at all and content used a local `z-index: 1`.

  Dialog sits below popovers, menus, selects, tooltips, and toasts on that scale. Those surfaces portal to the body as siblings of the dialog panel rather than descendants, so they must outrank it to remain visible when opened from inside a dialog.

- 3f24b2f: Reconstitute the nearest ThemeProvider scope on portaled Dialog content so theme CSS variables resolve outside the provider DOM subtree.
- 3fd5030: Make ScrollArea viewport keyboard-focusable by default (`tabIndex={0}`) so scrollable regions meet axe `scrollable-region-focusable`.
- 338fe46: Name multi-thumb `Slider` thumbs when `thumbLabels` is omitted: fall back to Field label or an indexed root `aria-label`, and wire `aria-describedby` on every thumb. Explicit `thumbLabels` clear Field `aria-labelledby` so they win in accessible name computation.
- Updated dependencies [b4fd11a]
- Updated dependencies [09d876d]
- Updated dependencies [3bf1155]
- Updated dependencies [7b6407b]
- Updated dependencies [338fe46]
- Updated dependencies [2c7c49f]
- Updated dependencies [3bf1155]
- Updated dependencies [e2aa5b9]
  - @reactive/silk-core@0.1.0
