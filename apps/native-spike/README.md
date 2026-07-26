# Silk native contract spike

Throwaway Expo app for Stage 1: prove `@reactive/silk-core` tokens + recipes can drive React Native `Box` / `Stack` / `Text` / `Button` **without** `@reactive/silk` or CSS variables.

Not published. No `build` script (skipped by root topological `yarn build`).

## Run

```bash
# from repo root
yarn install
yarn workspace @reactive/silk-core build   # if dist/ is missing

# smoke (Node — no simulator)
yarn workspace @reactive/silk-native-spike test

# Expo (optional)
yarn workspace @reactive/silk-native-spike start
yarn workspace @reactive/silk-native-spike web
```

## Layout

- `src/theme/ThemeProvider.tsx` — delivers `Theme` + density via context
- `src/styles/mapStyles.ts` — Theme/recipe → RN-shaped style objects (no RN imports)
- `src/components/*` — thin RN wrappers
- `FINDINGS.md` — web-shaped assumptions and divergences

See [FINDINGS.md](./FINDINGS.md) for contract notes.
