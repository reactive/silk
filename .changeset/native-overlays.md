---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': minor
---

Add `Dialog` (centered, or a bottom sheet), `Popover` and `Listbox` overlays to `@reactive/silk-native`, with their `SilkDefaults` keys and mappers, and a `placement` axis (`center` | `bottom`) on `dialogRecipe` that web `Dialog.Content` styles too. Also fixes `data-*` attributes on native components under react-native-web, which it had been dropping.
