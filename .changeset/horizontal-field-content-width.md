---
'@reactive/silk-native': patch
---

A horizontal `Field` is as wide as its control and label, so it no longer takes the room of what sits beside it in a row on Android and iOS. Its label column used to grow, which React Native's layout engine turns into the whole row's width.
