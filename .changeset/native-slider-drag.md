---
'@reactive/silk-native': patch
---

`Slider` drags on the UI thread: the thumb follows the finger between steps and springs to its step on release (`motion.snappy`), and `onValueChange` fires only as a step changes. On native a slide starts once the finger moves a touch slop along the slider, so a scroll view around it keeps scrolling, and a tap moves the nearest thumb there. A value a controlled owner turns down springs back to the owner's. On Android, `Slider` needs the app wrapped in Gesture Handler's `GestureHandlerRootView`; `Popover`, `Tooltip` and every `Dialog` give their `Modal` its own root, so a `Slider` there drags.
