---
'@reactive/silk-native': minor
---

`Switch` drags on the UI thread: its thumb follows a sideways drag and, let go, lands on the nearer end or the way a fling goes, springing there on the theme's `snappy` spring, carrying the finger's speed when it heads that way, without passing the track's ends. `onCheckedChange` fires once for a drag that lands on the side the switch isn't already on, and a change a controlled owner turns down springs back. A press still toggles it, and on the web the click a mouse drag ends with doesn't toggle it back. A change from a press or from the owner now springs on `snappy` too, rather than sliding on the `fast` duration. A vertical swipe that starts on it still scrolls the page.

*breaking:* on Android, a `Switch` outside Gesture Handler's `GestureHandlerRootView` now throws in development, as `Slider` does: wrap the app in one (`Popover`, `Tooltip` and `Dialog` give their `Modal` one).
