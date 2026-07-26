---
"@reactive/silk": minor
---

Add a `footer` slot to `Comment` for a trailing affordance that belongs to the comment rather than to its replies. It renders in the content column after the replies and outside their rail.

`CommentThread` now routes its "Continue thread" button there. It previously went through the `replies` slot, which always wraps its content in a railed reply stack, so a comment at `maxDepth` with nothing nested inline drew a reply rail beside a lone button.
