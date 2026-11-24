---
'@reactive/silk-native': minor
---

`Pager` (`Root`, `Page`) and `usePagerIsActive`: pages side by side, one shown at a time, which a sideways swipe moves between on the UI thread. Controlled by page `value`; a swipe proposes the page it settles on, and an owner that keeps its `value` sees the pages settle back. `useFlickGesture` calls back when a finger throws a view one way and lets go, and `gestureConventions` (touch slop, fling speed) is exported so apps' own gestures match Silk's.
