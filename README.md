# Silk

`@reactive/silk` — a long-lived design system foundation for React (web) with a path toward shared concepts on React Native / Expo.

This is **not** another Tailwind/shadcn component dump. Silk owns its API, uses **Radix for behavior**, **Linaria for statically extracted CSS**, and themes through **semantic tokens + CSS variables**.

## Status

Foundation milestone: token/theme/variant architecture, layout/visual/interaction exemplars, Identity composite, and a shadcn-protocol registry scaffold.

## Packages

| Package | Description |
| --- | --- |
| [`@reactive/silk-core`](packages/silk-core) | Platform-neutral tokens, `createTheme`, recipe contracts |
| [`@reactive/silk`](packages/silk) | Web design system (Radix + Linaria) |

The repo is a Yarn 4 workspaces monorepo so a future native package can be added without restructuring.

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

`silk-core` must build before `silk` (package exports and Linaria both resolve core from `dist/`). Topological `yarn workspaces foreach -A -pt` handles this — run `yarn build` before `yarn typecheck` on a clean checkout.

### Scripts

| Script | Description |
| --- | --- |
| `yarn build` | Build all workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn test` | Run tests |
| `yarn changeset` | Add a changeset for the next release |
| `yarn release` | Build and publish (used by CI) |

## Quick start

```tsx
import {
  Button,
  Identity,
  SilkProvider,
  createTheme,
} from '@reactive/silk';
import '@reactive/silk/styles.css';

const theme = createTheme({ colorScheme: 'light' });

export function App() {
  return (
    <SilkProvider colorScheme="light" defaults={{ Button: { variant: 'soft' } }}>
      <Button tone="accent">Save</Button>
      <Identity name="Ada Lovelace" meta="@ada" fallback="AL" />
    </SilkProvider>
  );
}
```

Custom / tenant themes use the style-attribute path:

```tsx
<SilkProvider theme={createTheme({ semantic: { color: { surface: '#fafafa' } } })}>
  …
</SilkProvider>
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
design-tokens
      ↓
semantic theme
      ↓
component recipes/contracts
      ↓
platform renderer (web: Radix + Linaria · native: later)
```

Hard constraints: no Tailwind, no CVA, CSS-first (Linaria), SSR-first (Anansi), accessibility via Radix.

## Registry

Composites can also be installed as source via the shadcn registry protocol. See root [`registry.json`](registry.json). Items pin `@reactive/silk` versions; zero Tailwind.

Validate:

```bash
npx shadcn@latest registry validate
```

## TypeScript 7

This project uses TypeScript 7 (native Go compiler via the `typescript` package). If declaration generation hits an edge case with the native compiler, the fallback is installing `@typescript/typescript6` for the dts step only — do not pre-install it unless needed.

## License

MIT
