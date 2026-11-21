---
'@reactive/silk-native': patch
---

Native `Slider` keeps its thumb under the finger in a right-to-left app. React Native turns a right-to-left app's `left` and `right` styles into `start` and `end`, which mirrored the thumb, range and marks away from where a press read them. The slider now lays its parts out left to right, and `dir` alone decides which end `min` sits at; the slider's own margins still follow the app's direction.
