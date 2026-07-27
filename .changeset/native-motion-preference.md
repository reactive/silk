---
'@reactive/silk-native': minor
---

Stop native Spinner and Progress from flashing their reduced-motion appearance on mount. React Native exposes the OS preference only through async `AccessibilityInfo`, so the first render is now `'unresolved'`: motion stays suppressed, but the full-motion visuals render until the OS confirms `'reduced'`. Adds `useMotionPreference` for components that swap appearance (not just animation) and caches the OS answer so only the first mount is ever unresolved.
