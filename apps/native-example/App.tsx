import {
  buttonRecipe,
  createTheme,
  generatePairedPalette,
  textRecipe,
  type ColorScheme,
  type DensityName,
} from '@reactive/silk-core';
import {
  Box,
  Button,
  Inline,
  SilkProvider,
  Stack,
  Text,
} from '@reactive/silk-native';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState, type JSX } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

const paired = generatePairedPalette('#0ea5e9');

/**
 * Stage 6 exit demo: same Theme object + recipe contracts as web,
 * delivered without CSS variables.
 */
export function App(): JSX.Element {
  const [scheme, setScheme] = useState<ColorScheme>('light');
  const [density, setDensity] = useState<DensityName>('comfortable');
  const [tenant, setTenant] = useState(true);

  const theme = useMemo(
    () =>
      createTheme({
        colorScheme: scheme,
        ...(tenant ? { palette: paired[scheme] } : {}),
      }),
    [scheme, tenant],
  );

  return (
    <SilkProvider theme={theme} density={density}>
      <SafeAreaView style={styles.root}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={styles.content}>
          <Box padding="4">
            <Stack gap="5">
              <Text role="headingLg">Silk native example</Text>
              <Text tone="secondary" measure="prose">
                Theme from createTheme (+ optional generatePairedPalette tenant).
                Styles from @reactive/silk-native recipe mappers — no CSS vars.
              </Text>

              <Stack gap="2">
                <Text role="label">Controls</Text>
                <Inline gap="2">
                  <Button
                    size="sm"
                    variant={scheme === 'light' ? 'solid' : 'outline'}
                    onPress={() => setScheme('light')}
                  >
                    Light
                  </Button>
                  <Button
                    size="sm"
                    variant={scheme === 'dark' ? 'solid' : 'outline'}
                    onPress={() => setScheme('dark')}
                  >
                    Dark
                  </Button>
                  <Button
                    size="sm"
                    variant={density === 'compact' ? 'solid' : 'outline'}
                    tone="neutral"
                    onPress={() =>
                      setDensity((d) =>
                        d === 'comfortable' ? 'compact' : 'comfortable',
                      )
                    }
                  >
                    Density: {density}
                  </Button>
                  <Button
                    size="sm"
                    variant={tenant ? 'solid' : 'outline'}
                    tone="success"
                    onPress={() => setTenant((t) => !t)}
                  >
                    Tenant: {tenant ? 'on' : 'off'}
                  </Button>
                </Inline>
              </Stack>

              <Stack gap="2">
                <Text role="heading">Button matrix</Text>
                {buttonRecipe.variants.variant.map((variant) => (
                  <Stack key={variant} gap="1">
                    <Text role="caption" tone="secondary">
                      {variant}
                    </Text>
                    <Inline gap="2">
                      {buttonRecipe.variants.tone.map((tone) => (
                        <Button key={tone} variant={variant} tone={tone} size="sm">
                          {tone}
                        </Button>
                      ))}
                      <Button variant={variant} size="sm" disabled>
                        disabled
                      </Button>
                    </Inline>
                  </Stack>
                ))}
                <Inline gap="2" align="center">
                  {buttonRecipe.variants.size.map((size) => (
                    <Button key={size} size={size}>
                      size {size}
                    </Button>
                  ))}
                </Inline>
              </Stack>

              <Stack gap="2">
                <Text role="heading">Text tones & roles</Text>
                <Inline gap="3" wrap="wrap">
                  {textRecipe.variants.tone.map((tone) => (
                    <Text key={tone} tone={tone}>
                      {tone}
                    </Text>
                  ))}
                </Inline>
                <Stack gap="1">
                  {textRecipe.variants.role.map((role) => (
                    <Text key={role} role={role}>
                      role={role}
                    </Text>
                  ))}
                </Stack>
                <Text measure="prose" tone="secondary">
                  Long prose measure:{' '}
                  {Array.from({ length: 40 }, () => 'word').join(' ')}
                </Text>
              </Stack>

              <Stack gap="2">
                <Text role="heading">Layout</Text>
                <Stack gap="2" rail="start">
                  <Text>Stack rail=start</Text>
                  <Text tone="secondary">Nested under rail</Text>
                </Stack>
                <Inline gap="2" direction="row-reverse" align="baseline" wrap="wrap">
                  <Text role="headingLg">Lg</Text>
                  <Text role="caption">caption baseline</Text>
                  <Text>row-reverse wrap</Text>
                </Inline>
                <Inline gap="2" wrap="nowrap">
                  <Text>nowrap</Text>
                  <Text>a</Text>
                  <Text>b</Text>
                </Inline>
              </Stack>

              <Stack gap="2">
                <Text role="heading">Nested providers</Text>
                <SilkProvider colorScheme={scheme === 'light' ? 'dark' : 'light'}>
                  <Box padding="3">
                    <Stack gap="2">
                      <Text>
                        Nested colorScheme flips to{' '}
                        {scheme === 'light' ? 'dark' : 'light'} default theme
                        (replaces tenant semantics).
                      </Text>
                      <Button size="sm">Nested scheme button</Button>
                    </Stack>
                  </Box>
                </SilkProvider>
                <SilkProvider density="compact">
                  <Box padding="3">
                    <Inline gap="2">
                      <Button size="sm">Compact nest</Button>
                      <Text role="caption" tone="secondary">
                        density-only inherit theme
                      </Text>
                    </Inline>
                  </Box>
                </SilkProvider>
              </Stack>
            </Stack>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </SilkProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
});

export default App;
