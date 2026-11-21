---
'@reactive/silk-native': minor
---

Add `Slider` to `@reactive/silk-native`, with web `Slider`'s contract: one number per thumb (`value` / `defaultValue` arrays, so a range has two), `onValueChange` / `onValueCommit`, `min` / `max` / `step`, `minStepsBetweenThumbs`, `orientation`, `dir`, `inverted`, `thumbLabels` and `thumbValueText`. Drag a thumb or press the track; on the web, arrow, Page, Home and End keys move a focused thumb; screen readers adjust it a step at a time. `children` draw over the track and under the thumbs, and `sliderMarkStyle` (with `mapSliderStyle`'s `thumbSize`) places them where the thumb sits at a value. Adds the `Slider` `SilkDefaults` key.
