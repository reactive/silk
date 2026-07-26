# Stage 3 API Matrix

Silk-owned public API for interaction primitives. Radix supplies behavior; Silk owns visuals, portals/theme reconstitution, recipes, and end-to-end accessibility. Rejected alternatives: thin Radix re-exports, flattened non-compound APIs, and a generic `FloatingPortal`.

Escape hatches on every rendered part: `className`, `style`, React 19 `ref`, data attributes, and `asChild` where Radix supports it. Remaining Radix behavior props pass through as advanced escape hatches; Silk documents the controlled contract below.

| Component | Public parts | Documented controlled props | Recipe / `SilkDefaults` | Provider | Notes |
| --- | --- | --- | --- | --- | --- |
| **Popover** | `Root Trigger Anchor Content Close` | `open`, `onOpenChange` | `size` (`sm`/`md`/`lg`); `Popover` | — | `Content.container`; no public Portal/Arrow v1. Web. |
| **Tooltip** | `Provider Root Trigger Content` | `open`, `onOpenChange` | none | `Tooltip.Provider` once at app/surface root | Timing/positioning passthrough. No Arrow v1. Web. |
| **DropdownMenu** | `Root Trigger Content Group Label Item CheckboxItem RadioGroup RadioItem ItemIndicator Separator Sub SubTrigger SubContent` | Root/Sub `open`; checkbox `checked`; radio `value` + change callbacks | none | — | `Content`/`SubContent.container`; hide portals. Compose `ItemIndicator` inside CheckboxItem/RadioItem. Web. |
| **Tabs** | `Root List Trigger Content` | `value`, `onValueChange` | `variant` (`line`/`enclosed`); `Tabs` | — | Orientation/activation passthrough. Shared contract. |
| **Accordion** | `Root Item Header Trigger Content` | Discriminated: `type="single"` → `value?: string`; `type="multiple"` → `value?: string[]` | none | — | Shared behavioral contract. |
| **Select** | `Root Trigger Value Content Group Label Item Separator` | `value`, `onValueChange`, `open`, `onOpenChange` | `size`, `density`; `Select` | Variant context on wrapped `Root` | Assembled: Trigger includes Icon; Content includes Viewport + scroll buttons; Item includes ItemText + indicator. Defaults `position="popper"`. `Content.container`. Web. |
| **ScrollArea** | `Root Viewport Scrollbar Thumb Corner` | — | none | — | Web-only; constant Viewport `<style>` (charter amendment). |
| **Toast** | `Provider Viewport Root Title Description Action Close` | `Root.open`, `onOpenChange` | `tone`; `Toast` | Explicit provider per app/toast region | Viewport portals via `Portal.Root` + theme scope; `container`. Web. |
| **Toggle** | callable `Toggle` | `pressed`, `onPressedChange` | `size`; `Toggle` | — | Shared contract. |
| **ToggleGroup** | `Root Item` | Discriminated `type="single" \| "multiple"` + matching `value` | shared `size`; `ToggleGroup` | Size context on `Root` | Shared contract. |

## Shared infrastructure (not public API)

- `floatingSurface` Linaria class + enter/exit keyframes (`silk-float-in` / `silk-float-out`, `fast` tokens).
- `floatingZIndex` — one stacking scale for every body-portaled surface, Dialog overlay/content included (see [ARCHITECTURE.md](ARCHITECTURE.md#stacking)).
- `ThemeScopePortal` (existing) — each primitive composes its own Radix Portal around it.
- Neutral control geometry helpers shared by Input/Select (Select must not inherit `--silk-input-*`).

## Dialog migration

Dialog Content/Overlay migrate onto shared floating-surface / motion conventions (distinct open/closed keyframes; exit animation) and onto the shared `floatingZIndex` scale. Size recipe unchanged.
