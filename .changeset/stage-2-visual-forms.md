---
"@reactive/silk-core": minor
"@reactive/silk": minor
---

Stage 2 visual primitives and forms foundation.

**breaking:**
- `ToneName`: add `success` to every exhaustive `Record<ToneName, …>` / switch.
- `InteractionToneColors`: add required `text`, `subtleHover`, and `subtleActive` (old soft/outline/ghost remaps of `border`/`hover` are gone — use the new slots).
- `SemanticTokens`: add `color.surfaceSunken`, `color.overlay`, `shadow.{raised,overlay}`, and `focusRing.{width,offset}`; typography adds `headingSm` / `headingXl`.
- Light solid fills use palette step 11 (was 9) so `onSolid: #fff` meets WCAG 4.5:1.
- Prefer the `sharedSemanticScales` constant; `createSharedSemanticScales()` still returns that shared object for compatibility.
- `MotionName` adds `loop` (1200ms, linear) for continuous indeterminate motion; `fast`/`normal`/`slow` stay one-shot transition durations. Exhaustive `Record<MotionName, …>` literals must add `loop`.
- Tone `hover` / `active` are now three distinct fills alongside `solid` in both schemes. Light `hover` is blended between palette steps 11 and 12 rather than being step 12 (which collided with `active`), and neutral `active` is step 11 rather than step 12 (which collided with `solid`). Themes that hardcoded those hex values must re-derive them.
- `FieldContextValue` drops `controlId`; `inputId` is now the single resolved control id. `Field.Root` gains `controlId` for naming that control — setting `id` on the control itself no longer retargets Label `htmlFor`, which previously required a post-hydration effect and produced a dangling `for=` on the server.

Adds `Surface`, `Card`, `Heading`, `Badge`, `Skeleton`, `Spinner`, `Progress`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`; settings-form fixture; contrast and theming acceptance tests.
