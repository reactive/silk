---
'@reactive/silk-native': patch
---

A `Slider` thumb no longer runs past the track's end. Flung toward `max` (or `min`), it used to spring past the end before it came back. It now springs to its step without passing it, and keeps a speed (the finger's, or that of the spring it replaces) only when that heads to the step. So a fling past the step, or a value a controlled owner turns down mid-spring, settles from rest instead of carrying on the other way first.
