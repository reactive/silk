---
'@reactive/silk-native': minor
---

New `Pager.Indicator`: a dot for each page of the `Pager.Root` it is a child of, over the pager's foot, so a reader can see there are pages a swipe away. The shown page's dot widens to a pill in `textPrimary`, and it follows a drag on the UI thread, passing from dot to dot as the pages move. Other dots are `textSecondary`, and a disabled page's is the fainter `borderSubtle`. It only shows: presses pass through it (a drag that starts on it still pages) and screen readers skip it. Write it as a direct child of `Pager.Root`, anywhere among the pages: `<Pager.Root value={page} onValueChange={setPage}><Pager.Page value="a" />…<Pager.Indicator /></Pager.Root>`. Its `style` moves it; `{ position: 'relative', bottom: 0 }` puts it below the pages instead of over them.
