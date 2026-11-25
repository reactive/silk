---
'@reactive/silk-native': patch
---

`Spinner`, `Skeleton` and an indeterminate `Progress` now loop as Reanimated CSS animations instead of React Native's `Animated`: on a phone they run on the UI thread, and on the web the browser plays them as CSS rather than JavaScript stepping each frame; a `style` that gives `Skeleton` an `opacity` or `Spinner` a `transform` still wins and holds that loop still. `Progress` no longer measures its track, so its sweep starts on the first frame, and in a right-to-left app it now crosses the whole track from the right (it used to start past the right edge and stop short of the left).
