---
'@reactive/silk-native': patch
---

On the web, a `Pager` and a `Switch` leave the browser its panning across their drag again, as does a `useFlickGesture` view, so a page scrolls when a finger moves across them: Gesture Handler had replaced the `touch-action` they set with `none`. A bottom sheet's panel now leaves the browser its sideways panning (`pan-x`, was `none`), so a sideways scroller inside it scrolls.
