---
'@reactive/silk-native': patch
---

On the web, a `Pager`, a `Switch` and a `useFlickGesture` view leave the browser its panning across their drag again, so a page scrolls when a finger moves across them: Gesture Handler had replaced the `touch-action` they set with `none`. A bottom sheet's panel now leaves the browser its sideways panning too (`pan-x`, was `none`), so a sideways scroller inside it scrolls. `useFlickGesture`, not yet released, returns only `{ gesture }`.
