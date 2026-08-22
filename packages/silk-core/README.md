# @reactive/silk-core

Platform-neutral foundations for Silk: design tokens, semantic themes, recipe
contracts, and shared models. The package has no React or DOM dependency and is
used by both the web and React Native renderers.

## Install

```bash
yarn add @reactive/silk-core
```

## Create a theme

```ts
import {
  checkThemeContrast,
  createTheme,
  generatePairedPalette,
} from '@reactive/silk-core';

const palettes = generatePairedPalette('#0ea5e9');

export const lightTheme = createTheme({
  colorScheme: 'light',
  palette: palettes.light,
  semantic: {
    radius: { control: 8 },
  },
});

const contrast = checkThemeContrast(lightTheme);
```

`createTheme` fills in the complete semantic contract from partial palette and
semantic overrides. Components consume semantic tokens rather than palette
steps, allowing renderers to share intent without sharing a styling mechanism.

## Recipes

Recipes describe typed variant values and defaults; platform renderers decide
how to turn those contracts into CSS or React Native style objects.

```ts
import {
  buttonRecipe,
  type ButtonVariantProps,
} from '@reactive/silk-core/recipes';

const defaults: ButtonVariantProps = buttonRecipe.defaults;
```

## Entry points

- `@reactive/silk-core` — complete public API
- `@reactive/silk-core/tokens` — token types and default scales
- `@reactive/silk-core/theme` — theme creation, palette generation, and contrast
  utilities
- `@reactive/silk-core/recipes` — recipe definitions and variant types
- `@reactive/silk-core/models` — shared composite data models

See the [Silk documentation](https://reactive.github.io/silk/) or the
[repository architecture](https://github.com/reactive/silk/blob/main/docs/ARCHITECTURE.md)
for how core contracts are consumed by each renderer.

## License

MIT
