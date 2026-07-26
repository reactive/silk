# Silk

`@reactive/silk` — a long-lived design system foundation for React (web) with a path toward shared concepts on React Native / Expo.

This is **not** another Tailwind/shadcn component dump. Silk owns its API, uses **Radix for behavior**, **Linaria for statically extracted CSS**, and themes through **semantic tokens + CSS variables**.

## Documentation

**Primary docs site:** [Storybook on GitHub Pages](https://reactive.github.io/silk/) (tracks `main`).

Locally:

```bash
yarn build   # silk-core dist required for Linaria
yarn docs    # http://localhost:6006
```

## Status

Stage 2 (visual primitives & forms): `Surface`, `Card`, `Heading`, `Badge`, status primitives, `Field`/`Input`/`Textarea`, Radix-backed form controls, token audit (`success`, elevation shadows, contrast), SettingsForm fixture, and [pre-1.0 API policy](docs/API_POLICY.md). Stage 1 layout vocabulary remains. The staged plan is in [docs/ROADMAP.md](docs/ROADMAP.md); the project charter is [docs/PRINCIPLES.md](docs/PRINCIPLES.md).

## Packages

| Package | Description |
| --- | --- |
| [`@reactive/silk-core`](packages/silk-core) | Platform-neutral tokens, `createTheme`, recipe contracts |
| [`@reactive/silk`](packages/silk) | Web design system (Radix + Linaria) |

## Apps

| App | Description |
| --- | --- |
| [`@reactive/silk-docs`](apps/docs) | Private Storybook docs site (not published) |
| [`@reactive/silk-native-spike`](apps/native-spike) | Throwaway Expo spike consuming `silk-core` (Stage 1; not published) |

Libraries live under `packages/`; runnable consumers (docs, future playgrounds / native examples) live under `apps/`.

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
| `yarn build` | Build publishable workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn test` | Run tests |
| `yarn docs` | Start Storybook docs site |
| `yarn docs:build` | Build static Storybook (`apps/docs/storybook-static`) |
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

Component usage and theming live in [Storybook](https://reactive.github.io/silk/). The repository architecture write-up is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), the guiding principles are [docs/PRINCIPLES.md](docs/PRINCIPLES.md), and the staged plan is [docs/ROADMAP.md](docs/ROADMAP.md).

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

Composites can also be installed as source via the shadcn registry protocol. See root [`registry.json`](registry.json). Items will pin compatible `@reactive/silk` versions once published from release tags (the scaffold is unpinned pre-release); zero Tailwind.

Validate:

```bash
npx shadcn@latest registry validate
```

## TypeScript 7

This project uses TypeScript 7 (native Go compiler via the `typescript` package). If declaration generation hits an edge case with the native compiler, the fallback is installing `@typescript/typescript6` for the dts step only — do not pre-install it unless needed.

## License

MIT
