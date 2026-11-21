---
'@reactive/silk-native': minor
---

Add the `@reactive/silk-native/gesture` entry (optional peers: Gesture Handler, Reanimated and Worklets): the same `Dialog`, whose bottom sheet follows a drag on the UI thread, springs with the release speed (none after the finger is held still), closes when flicked down or thrown past half its height (lower than where the drag caught it), and settles back otherwise. Its `Dialog.ScrollView` hands a pull-down at the top of the sheet's content to the sheet.
