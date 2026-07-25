# Silk

`@reactive/silk` — a long-lived design system foundation for React (web) with a path toward shared concepts on React Native / Expo.

This is **not** another Tailwind/shadcn component dump. Silk owns its API, uses **Radix for behavior**, **Linaria for statically extracted CSS**, and themes through **semantic tokens + CSS variables**.

## Status

Scaffold only. Package layout, build pipeline (Rslib / Rspack + Linaria), TypeScript 7, Changesets, and GitHub Actions CI are in place. Components and the full token system will land next.

## Packages

| Package | Description |
| --- | --- |
| [`@reactive/silk`](packages/silk) | Published design system (web first) |

The repo is a Yarn 4 workspaces monorepo so future packages (tokens, native) can be added without restructuring.

## Requirements

- Node.js 22+
- [Yarn 4](https://yarnpkg.com/) via Corepack

## Development

```bash
corepack enable
yarn install
yarn build
yarn typecheck
yarn test
```

### Scripts

| Script | Description |
| --- | --- |
| `yarn build` | Build all workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn test` | Run tests |
| `yarn changeset` | Add a changeset for the next release |
| `yarn release` | Build and publish (used by CI) |

## Publishing

Releases are managed with [Changesets](https://github.com/changesets/changesets).

1. Contributors add a changeset with `yarn changeset`.
2. On push to `main`, the release workflow opens/updates a **Version Packages** PR.
3. Merging that PR publishes to npm.

Configure the `NPM_TOKEN` repository secret before publishing.

## Architecture (intended)

```text
design-tokens
      ↓
semantic theme
      ↓
component recipes/contracts
      ↓
platform renderer (web: Radix + Linaria · native: React Native)
```

Hard constraints: no Tailwind, no CVA, CSS-first (Linaria), SSR-first (Anansi), accessibility via Radix.

## TypeScript 7

This project uses TypeScript 7 (native Go compiler via the `typescript` package). If declaration generation hits an edge case with the native compiler, the fallback is installing `@typescript/typescript6` for the dts step only — do not pre-install it unless needed.

## License

MIT
