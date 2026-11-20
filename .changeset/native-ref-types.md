---
'@reactive/silk-native': patch
---

Type every component's `ref` as the host element React Native gives it (`ComponentRef<typeof View>`, `ComponentRef<typeof Text>` or `ComponentRef<typeof TextInput>`), so `.focus()` and `.measureInWindow()` type-check on React Native versions whose components are functions, such as 0.88.
