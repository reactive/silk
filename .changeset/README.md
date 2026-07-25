# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versions and publish `@reactive/silk`.

```bash
yarn changeset
```

On push to `main`, GitHub Actions opens a Version Packages PR. Merging it publishes to npm (requires the `NPM_TOKEN` secret).
