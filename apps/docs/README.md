# `@reactive/silk-docs`

Private Storybook app — the primary documentation site for Silk.

Lives under `apps/` (runnable consumers), not `packages/` (publishable libraries).

- Dev: `yarn docs` (from repo root — watch-builds silk-core; preview uses runtime theme vars)
- Static build: `yarn docs:build` → `storybook-static/`
- Deployed to [GitHub Pages](https://reactive.github.io/silk/) from `main` via `.github/workflows/docs.yml`

This app has **no** `build` script so it is not pulled into package release builds.

## Show code / source panel

The code panel (`parameters.docs.codePanel`) should let readers reproduce each example. Prefer inline JSX of `@reactive/silk` components in the story `render` / `args`.

When a story needs local plumbing (fixtures, matrices, hook wrappers):

1. Put the helper in a sibling `*.demo.tsx` (or keep a fixture module under `fixtures/`).
2. Import its source with `?raw` and attach it via `withSource` / `withStaticSource` / `matrixSource` from [`src/docsSource.ts`](src/docsSource.ts).

```ts
import { withSource } from '../docsSource';
import { ToastStory } from './Toast.demo';
import toastDemoSource from './Toast.demo.tsx?raw';

const meta = {
  parameters: withSource(toastDemoSource),
};
```

Matrix stories use `matrixSource` (`type: 'dynamic'` + prefer CSF `originalSource` + `VariantMatrix.tsx`) so function children stay visible while the transform still runs. A unit test in `src/test/docsSource.test.ts` fails if a story imports local helpers without calling `withSource` / `matrixSource` with a `?raw` attachment.
