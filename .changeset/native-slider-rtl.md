---
'@reactive/silk-native': patch
---

Native `Slider` keeps its thumb, range and marks under the finger in a right-to-left app, where they had drawn mirrored, and with padding or a border on the slider, which had offset presses. `mapSliderStyle` returns a new `parts` style for the box that holds them; the slider lays that box out left to right in any app, and marks inherit that direction.
