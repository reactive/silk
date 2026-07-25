# `@reactive/silk-docs`

Private Storybook app — the primary documentation site for Silk.

Lives under `apps/` (runnable consumers), not `packages/` (publishable libraries).

- Dev: `yarn docs` (from repo root; requires `yarn build` first)
- Static build: `yarn docs:build` → `storybook-static/`
- Deployed to [GitHub Pages](https://reactive.github.io/silk/) from `main` via `.github/workflows/docs.yml`

This app has **no** `build` script so it is not pulled into package release builds.
