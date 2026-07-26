# Silk native example

Expo app for Stage 6: consume `@reactive/silk-native` with the same semantic
`Theme` object and recipe contracts as web. Not published. No `build` script
(skipped by root topological `yarn build`).

## Run

```bash
# from repo root
yarn install
yarn workspace @reactive/silk-core build
yarn workspace @reactive/silk-native build

# smoke (Node — no simulator)
yarn workspace @reactive/silk-native-example test

# Expo
yarn workspace @reactive/silk-native-example start
yarn workspace @reactive/silk-native-example web

# Metro consumability check
yarn workspace @reactive/silk-native-example export:web
```

## Exit demo

`App.tsx` exercises Box / Stack / Inline / Text / Button across recipe axes,
densities, light/dark, a tenant theme (`generatePairedPalette` → `createTheme`),
nested providers, pressed/disabled, long text, wrap / row-reverse / baseline /
rail.
