# @reactive/silk

Silk's React renderer: an SSR-first design system built with semantic themes,
statically extracted Linaria CSS, and Radix behavior.

Silk owns its component APIs and visual language. It does not require Tailwind,
CVA, or a runtime CSS-in-JS provider.

## Install

```bash
yarn add @reactive/silk react react-dom
```

## Quick start

Import one of the package stylesheets once at your application entry point, then
wrap your UI in `SilkProvider`:

```tsx
import { Button, SilkProvider, Stack, Text } from '@reactive/silk';
import '@reactive/silk/styles.css';

export function App() {
  return (
    <SilkProvider
      colorScheme="system"
      defaults={{ Button: { variant: 'soft' } }}
    >
      <Stack gap="4">
        <Text role="body">A design system with durable contracts.</Text>
        <Button tone="accent">Get started</Button>
      </Stack>
    </SilkProvider>
  );
}
```

Silk ships no font files. Load the fonts used by your theme in your application,
or override the semantic font-family tokens.

## Theming

Use the built-in light, dark, or system color scheme, or provide a custom
semantic theme:

```tsx
import {
  SilkProvider,
  createTheme,
  generatePairedPalette,
} from '@reactive/silk';

const palettes = generatePairedPalette('#0ea5e9');
const theme = createTheme({
  colorScheme: 'light',
  palette: palettes.light,
});

<SilkProvider theme={theme}>{/* application */}</SilkProvider>;
```

Providers may be nested. Component-level defaults are typed, and component
props, public CSS variables, `className`, `style`, refs, and supported
`asChild` props provide progressively more local customization.

## Stylesheets

- `@reactive/silk/styles.css` contains the standard unlayered styles.
- `@reactive/silk/styles.layer.css` wraps the same rules in `@layer silk`, so
  unlayered consumer styles win regardless of import order. Use it when you
  control the layering of your reset and application CSS.

## What is included

- Layout primitives such as `Box`, `Stack`, `Inline`, `Grid`, and `Container`
- Visual primitives such as `Text`, `Heading`, `Button`, `Card`, and `Badge`
- Forms and accessible interactions backed by Radix behavior
- Compound and convenience APIs for composites such as `Identity`, `PostCard`,
  `Comment`, `ProfileCard`, and `SettingsPanel`
- Theme, recipe, and model contracts re-exported from `@reactive/silk-core`

Browse the [component documentation and examples](https://reactive.github.io/silk/),
or see the [repository](https://github.com/reactive/silk) for architecture,
contribution, and release details.

## License

MIT
