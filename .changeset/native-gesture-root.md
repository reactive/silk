---
'@reactive/silk-native': minor
---

**Breaking:** install `react-native-gesture-handler`, `react-native-reanimated` and `react-native-worklets` as peers, with the worklets Babel plugin (Expo's preset adds it). `@reactive/silk-native/gesture`'s `Dialog` → `@reactive/silk-native`'s `Dialog` (type `GestureDialog` → `DialogNamespace`), same API; `/gesture` stays one release as a deprecated alias.

The root `Dialog`'s bottom sheet drags on the UI thread, and `Dialog.ScrollView` hands a pull-down at its top to the sheet.
