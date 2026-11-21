---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': minor
---

Add overlays to `@reactive/silk-native`: `Dialog` (a centered panel, or a bottom sheet with `placement="bottom"`), `Popover` (a surface beside an anchor), and `Listbox` (a pick-one list with arrow-key focus, for use inside a Popover or alone). `Dialog` uses React Native's `Modal` everywhere, which react-native-web renders as an `aria-modal` dialog. `Popover` is non-modal on the web, so a menu can open on hover, and a `Modal` on native. `dialogRecipe` gains a `placement` axis (`center` | `bottom`), which web `Dialog.Content` now styles too. `SilkDefaults` (native) gains `Dialog`, `Popover` and `Select`, and the mappers `mapDialogStyle`, `mapPopoverStyle` and `mapListboxItemStyle` are new. Also fixes `data-*` attributes on native components under react-native-web (RadioGroup's `data-state`, Field's part markers), which react-native-web had been dropping.
