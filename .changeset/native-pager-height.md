---
'@reactive/silk-native': patch
---

`Pager` holds its pages to its own height when it has one, so a scroll view in a page scrolls inside it. On the web the pages grew to their content instead, past the pager's bottom; on native a page with tall content that didn't scroll did the same.
