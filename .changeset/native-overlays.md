---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': minor
---

Add `Dialog` (centered, or a bottom sheet), `Popover` and `Listbox` overlays to `@reactive/silk-native`, with their `SilkDefaults` keys and mappers. On the web, `Popover` is non-modal (a hover-opened menu keeps working) and moves focus in as it opens unless `Popover.Content`'s `onOpenAutoFocus` calls `preventDefault()`. `Listbox.ItemText` colors custom item text as the label, or with `tone="secondary"` as a description; both dim on a disabled item. It adds a `placement` axis (`center` | `bottom`) on `dialogRecipe` that web `Dialog.Content` styles too. Also fixes `data-*` attributes on native components under react-native-web, which it had been dropping.
