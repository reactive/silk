---
'@reactive/silk-native': patch
---

Type every component's `ref` as the host element React Native gives it (`ComponentRef<typeof View>`), so `.focus()` and `.measureInWindow()` type-check on React Native versions whose `View` is a function component, such as 0.88.
