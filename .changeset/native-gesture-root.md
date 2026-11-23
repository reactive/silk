---
'@reactive/silk-native': minor
---

**Breaking:** install `react-native-gesture-handler`, `react-native-reanimated` and `react-native-worklets` as peers, with the worklets Babel plugin (Expo's preset adds it). `@reactive/silk-native/gesture`'s `Dialog` → `@reactive/silk-native`'s `Dialog`, same API; `/gesture` stays one release as a deprecated alias.

The root `Dialog`'s bottom sheet now drags on the UI thread: a flick or a throw past half closes it, otherwise it springs back, and `Dialog.ScrollView` hands a pull-down at the top of its content to the sheet.
