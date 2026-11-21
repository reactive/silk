---
'@reactive/silk-native': minor
---

Add the `@reactive/silk-native/gesture` entry: the same `Dialog`, whose bottom sheet drags. The sheet follows the finger on the UI thread (Gesture Handler, Reanimated and Worklets, optional peers), springs with the release speed, closes when flicked down or thrown past half its height, and settles back otherwise. `Dialog.ScrollView` hands a pull-down at the top of the sheet's content to the sheet.
