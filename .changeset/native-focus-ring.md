---
'@reactive/silk-native': minor
---

Show a keyboard focus ring on native controls. Adds `Pressable`, a drop-in for React Native's that outlines itself in the theme's `focusRing` color while focus is visible: on the web, only when the browser's `:focus-visible` matches (Tab, not a click); on native, on any focus. `Button`, pressable `Card` and `Surface`, `Checkbox`, `Switch` and `RadioGroup.Item` use it, ringing in their tone or in `danger` when invalid, as on web. `style` and `children` functions also receive `hovered` and `focusVisible`. Adds the `mapFocusRingStyle` mapper.
