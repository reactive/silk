---
'@reactive/silk-native': patch
---

On the web, a `Pager`, a `Switch` and a `useFlickGesture` view leave the browser its panning across their drag again, so a page scrolls when a finger moves across them: Gesture Handler had replaced the `touch-action` they set with `none`. `useFlickGesture` now returns only `{ gesture }`, still spread onto a `GestureDetector`.
