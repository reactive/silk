---
'@reactive/silk-native': minor
---

`springTo` takes `speedAway: 'drop'`: a starting speed (given, or carried from the animation it replaces) that points away from the target is dropped, so the spring starts from rest. With `overshootClamping`, the value then stays between where it starts and the target. `Switch` and `Slider` settle this way. The default, `'keep'`, is unchanged.
