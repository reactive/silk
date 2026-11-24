---
'@reactive/silk-native': minor
---

`Pager` (`Root`, `Page`) and `usePagerIsActive`: pages side by side, one shown at a time, which a sideways swipe moves between on the UI thread. Controlled by page `value`; a swipe proposes the page it lands on (passing disabled pages by), and an owner that keeps its `value` sees the pages settle back. `useFlickGesture` calls back when a finger throws a view one way and lets go, and `gestureConventions` (touch slop, fling speed) is exported so apps' own gestures match Silk's. On the web, a mouse drag of a sheet, a pager or a flick no longer also presses the button it began on.
