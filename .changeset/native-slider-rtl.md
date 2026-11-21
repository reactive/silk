---
'@reactive/silk-native': patch
---

Native `Slider` keeps its thumb, range and marks under the finger in a right-to-left app, where they had drawn mirrored. `mapSliderStyle` returns a new `parts` style for the box that holds them, which lays out left to right in any app; marks inherit that direction.
