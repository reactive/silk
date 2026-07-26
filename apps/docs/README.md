# `@reactive/silk-docs`

Private Storybook app — the primary documentation site for Silk.

Lives under `apps/` (runnable consumers), not `packages/` (publishable libraries).

- Dev: `yarn docs` (from repo root — watch-builds silk-core; preview uses runtime theme vars)
- Static build: `yarn docs:build` → `storybook-static/`
- Deployed to [GitHub Pages](https://reactive.github.io/silk/) from `main` via `.github/workflows/docs.yml`

This app has **no** `build` script so it is not pulled into package release builds.

## Show code / source panel

The code panel (`parameters.docs.codePanel`) should let readers reproduce each example. Prefer inline JSX of `@reactive/silk` components in the story `render` / `args`.

Extract a helper module only when the CSF snippet would otherwise be opaque (fixtures, shared hook wrappers, matrices). Then import its source with `?raw` and attach it via `withSource` / `matrixSource` from [`src/docsSource.ts`](src/docsSource.ts):

```ts
import { withSource } from '../docsSource';
import { LayeringStory } from './Dialog.demo';
import dialogDemoSource from './Dialog.demo.tsx?raw';

const meta = {
  parameters: withSource(dialogDemoSource),
};
```

Matrix stories use `matrixSource` so function children stay visible. A unit test in `src/test/docsSource.test.ts` fails if a story imports a local helper without attaching that helper’s source.
