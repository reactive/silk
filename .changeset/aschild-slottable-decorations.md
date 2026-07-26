---
"@reactive/silk": patch
---

Fix `asChild` on every part that renders a decoration alongside its children. `Select.Trigger`, `Accordion.Trigger`, `DropdownMenu.SubTrigger`, `DropdownMenu.Item`, and `Field.Label` each threw "Primitive.\* failed to slot onto its children" because the chevron / caret / shortcut / required indicator was a second slot child. Their children are now wrapped in `Slot.Slottable`, so a custom element receives its own children plus the appended decoration. This applies even where the decoration is conditional (`DropdownMenu.Item shortcut`, `Field.Label` on a required field) — the `null` branch counted as a second child, so those parts threw on `asChild` regardless. The default (non-`asChild`) render path is unchanged.

Two assembled parts cannot support `asChild` at all, and now say so at the type level instead of throwing at runtime: `asChild` is omitted from `SelectItemProps` and `SelectContentProps`, matching `Checkbox`, `Switch`, `Slider`, `RadioGroup`, and `Progress`. `Select.Item` wraps children in `RadixSelect.ItemText`, and `Slottable` substitutes the consumer's children unwrapped, so no arrangement yields "consumer element is the item, containing indicator + `ItemText`". `Select.Content` assembles a Viewport plus both scroll buttons, so there is likewise no single slot target.

The rule and its `null`-branch pitfall are documented once in [ARCHITECTURE.md](../docs/ARCHITECTURE.md#aschild-with-decorations).
