---
'@reactive/silk-native': patch
---

`silk-native` loads again where the worklets Babel plugin runs (an app's build and its Jest tests): `Slider`'s geometry no longer reads a worklet declared below it, and the sheet's drag no longer spreads into the config its gesture hook takes.
