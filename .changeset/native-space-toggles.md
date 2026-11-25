---
'@reactive/silk-native': patch
---

On the web, Space toggles a focused `Switch`, `Checkbox` or `RadioGroup` item, as Enter already did, and no longer scrolls the page. It works for any `Pressable` whose role is `checkbox`, `radio` or `switch`, and presses once however long the key is held. react-native-web presses only buttons with Space.
