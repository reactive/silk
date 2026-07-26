---
'@reactive/silk-core': minor
'@reactive/silk': minor
---

Stage 4 composites: product components, serializable models, and composition standard.

- Add `@reactive/silk-core/models` (Identity/Stat/Media/Post/Comment/Notification/Profile/FeedEntry) and composite recipes.
- Close primitive gaps: Card/Surface `interactive` hover elevation, Inline `direction`, Stack `rail`, `StatusDot`.
- Ship composites: MediaObject, ActionBar, StatGroup, EmptyState, PostCard, Comment, CommentThread, Notification, FeedItem, ProfileCard, SettingsPanel.
- Document the compound-first dual API in `docs/COMPOSITES.md`.
- Retrofit Identity onto Inline (additive `model` prop — non-breaking).
- SocialFeed exit fixture; registry sync script emits consumer-owned composite source.
