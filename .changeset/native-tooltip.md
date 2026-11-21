---
'@reactive/silk-native': minor
---

Add `Tooltip` to `@reactive/silk-native`, with web `Tooltip`'s `Root`, `Trigger` and `Content` parts (no `Provider`). The trigger is a box around the control it explains, so a disabled control still opens it: on the web a mouse resting on it or keyboard focus opens it, and on any platform a press that nothing inside takes does. It closes as the pointer or focus leaves, and on a press outside, Escape or the back button. Adds `mapTooltipStyle`.
