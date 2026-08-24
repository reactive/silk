# @reactive/silk-native

## 0.1.0

### Minor Changes

- c3b0184: Stop native Spinner and Progress from flashing their reduced-motion appearance on mount. React Native exposes the OS preference only through async `AccessibilityInfo`, so the first render is now `'unresolved'`: motion stays suppressed, but the full-motion visuals render until the OS confirms `'reduced'`. Adds `useMotionPreference` for components that swap appearance (not just animation) and caches the OS answer so only the first mount is ever unresolved.
- c3b0184: Expand the native renderer with visual primitives (Surface, Card, Heading, Badge, Separator, Avatar, StatusDot, Skeleton, Spinner, Progress) and forms (Input, Textarea, Field, Checkbox, Switch, RadioGroup). Same silk-core recipes as web; RNW a11y compat helpers; Slider deferred to preserve the shared array-valued contract.
- 0789bd0: Introduce `@reactive/silk-native`: React Native renderer for Silk with context-based `ThemeProvider` / `SilkProvider`, style mappers from `silk-core` recipes, and exemplar components `Box`, `Stack`, `Inline`, `Text`, and `Button`. Same semantic Theme object and recipe contracts as web; no CSS variables.

### Patch Changes

- Updated dependencies [b4fd11a]
- Updated dependencies [09d876d]
- Updated dependencies [3bf1155]
- Updated dependencies [7b6407b]
- Updated dependencies [338fe46]
- Updated dependencies [2c7c49f]
- Updated dependencies [3bf1155]
- Updated dependencies [e2aa5b9]
  - @reactive/silk-core@0.1.0
