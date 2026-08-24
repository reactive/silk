# @reactive/silk-native

Silk's React Native renderer. It applies the same semantic `Theme` objects and
recipe contracts as Silk for the web, using React context and native style
objects instead of CSS variables.

## Install

```bash
yarn add @reactive/silk-native @reactive/silk-core react react-native
```

## Quick start

```tsx
import { createTheme } from '@reactive/silk-core';
import {
  Box,
  Button,
  SilkProvider,
  Stack,
  Text,
} from '@reactive/silk-native';

const theme = createTheme({ colorScheme: 'light' });

export function App() {
  return (
    <SilkProvider
      theme={theme}
      defaults={{ Button: { variant: 'soft' } }}
    >
      <Box padding="4">
        <Stack gap="4">
          <Text role="body">The same semantic contract, rendered natively.</Text>
          <Button tone="accent" onPress={() => {}}>
            Continue
          </Button>
        </Stack>
      </Box>
    </SilkProvider>
  );
}
```

`SilkProvider` accepts a custom `theme`, a `colorScheme` of `light`, `dark`, or
`system`, a `density`, and typed per-component defaults. Nested providers inherit
omitted values. An explicit theme or color scheme replaces the parent theme.

## Components

The native renderer includes layout, typography, visual, and form primitives:
`Box`, `Stack`, `Inline`, `Text`, `Heading`, `Button`, `Surface`, `Card`, `Badge`,
`Separator`, `Avatar`, `StatusDot`, `Skeleton`, `Spinner`, `Progress`, `Input`,
`Textarea`, `Field`, `Checkbox`, `Switch`, and `RadioGroup`.

Native components expose recipe props plus React Native host props. Consumer
`style` values are composed last, followed by refs and the remaining native
escape hatches. There are no CSS imports, class names, or public CSS variables.

Use `@reactive/silk-core` directly to create tenant themes, generate paired
palettes, inspect recipes, or share theme and model types with web code.

See the [Silk documentation](https://reactive.github.io/silk/) or the
[native example app](https://github.com/reactive/silk/tree/main/apps/native-example)
for more examples.

## License

MIT
