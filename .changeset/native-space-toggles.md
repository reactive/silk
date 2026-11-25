---
'@reactive/silk-native': patch
---

On the web, Space toggles a focused `Switch`, `Checkbox` or `RadioGroup` item, and no longer scrolls the page. It works for any `Pressable` whose role is `checkbox`, `radio` or `switch`: Space presses it when the key goes down, once however long it is held, unless the `Pressable`'s own `onKeyDown` prevented the key. react-native-web presses only buttons with Space.
