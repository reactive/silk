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

`App.tsx` exercises layout, visual, and form components across recipe axes,
densities, light/dark, a tenant theme (`generatePairedPalette` → `createTheme`),
nested providers, pressed/disabled, long text, wrap / row-reverse / baseline /
rail. Native `Slider` is deferred (see API_POLICY).

## Manual device checklist

RNW / jsdom tests cannot catch these — verify on iOS + Android before release:

- [ ] Surface / Card shadows (iOS `shadow*` vs Android `elevation`)
- [ ] Spinner ring rendering (mixed border colors + full radius)
- [ ] Switch thumb slide + reduced-motion instant snap
- [ ] Skeleton opacity pulse vs static under Reduce Motion
- [ ] Progress determinate width + indeterminate sweep (RTL flip)
- [ ] TalkBack / VoiceOver: Checkbox / Switch / Radio / Progress announcements
- [ ] Field Error `alert` announcement when invalid
- [ ] RTL layout for Switch travel and Field horizontal rows
- [ ] Touch targets for Checkbox / Switch in crowded Field rows
