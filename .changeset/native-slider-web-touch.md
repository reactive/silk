---
'@reactive/silk-native': patch
---

`Slider` drags under a finger in phone browsers again: Gesture Handler's unused tap no longer resets the slider's `touch-action`, so the browser stops taking the drag as a scroll.
