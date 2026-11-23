---
'@reactive/silk-native': minor
---

**Breaking:** add `react-native-gesture-handler`, `react-native-reanimated` and `react-native-worklets` as dependencies, with the worklets Babel plugin (Expo's preset adds it). `@reactive/silk-native/gesture`'s `Dialog` → `@reactive/silk-native`'s `Dialog`, same API; the `/gesture` entry is a deprecated alias that goes in the next release.

The root `Dialog`'s bottom sheet follows a drag on the UI thread, springs with the release speed (none after the finger is held still), closes when flicked down or thrown past half its height (lower than where the drag caught it), and settles back otherwise. Its `Dialog.ScrollView` hands a pull-down at the top of the sheet's content to the sheet.
