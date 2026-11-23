---
'@reactive/silk-native': minor
---

The root `Dialog` is now the one whose bottom sheet drags, with `Dialog.ScrollView`. Gesture Handler, Reanimated and Worklets become required peers of `@reactive/silk-native`, and `@reactive/silk-native/gesture` is a deprecated alias that goes in the next release.

**Breaking:** install the three peers, and run the worklets Babel plugin (Expo's preset adds it).
