import {
  buttonRecipe,
  createTheme,
  generatePairedPalette,
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
import { useMemo, type JSX } from 'react';

export const nativeShellStates = [
  'normal',
  'compact',
  'dark',
  'tenant',
  'nested',
  'longContent',
  'disabled',
] as const;

export type NativeShellState = (typeof nativeShellStates)[number];

const paired = generatePairedPalette('#0ea5e9');
const longContentFiller = Array.from({ length: 60 }, () => 'content').join(' ');

export interface NativeShellProps {
  readonly state?: NativeShellState;
}

/**
 * Stage 6 docs fixture — RNW-rendered native shell with an explicit state matrix.
 */
export function NativeShell({
  state = 'normal',
}: NativeShellProps): JSX.Element {
  const scheme: ColorScheme =
    state === 'dark' || state === 'tenant' ? 'dark' : 'light';
  const density: DensityName = state === 'compact' ? 'compact' : 'comfortable';
  const useTenant = state === 'tenant';

  const theme = useMemo(
    () =>
      createTheme({
        colorScheme: scheme,
        ...(useTenant ? { palette: paired[scheme] } : {}),
      }),
    [scheme, useTenant],
  );

  return (
    <div data-fixture="native-shell" data-fixture-state={state}>
      <SilkProvider theme={theme} density={density}>
        <Box padding="4">
          <Stack gap="4">
            <Text role="headingLg">Native shell</Text>
            <Text tone="secondary" testID="native-shell-summary">
              state={state} · scheme={scheme} · density={density}
              {useTenant ? ' · tenant' : ''}
            </Text>

            <div data-region="buttons">
              <Stack gap="2">
                <Text role="label">Buttons</Text>
                <Inline gap="2" wrap="wrap">
                  {buttonRecipe.variants.tone.map((tone) => (
                    <Button
                      key={tone}
                      tone={tone}
                      size="sm"
                      disabled={state === 'disabled'}
                    >
                      {tone}
                    </Button>
                  ))}
                </Inline>
              </Stack>
            </div>

            {state === 'longContent' ? (
              <div data-region="long-content">
                <Stack gap="2">
                  <Text measure="prose" tone="secondary">
                    {longContentFiller}
                  </Text>
                </Stack>
              </div>
            ) : null}

            {state === 'nested' ? (
              <div data-region="nested">
                <Stack gap="2">
                  <SilkProvider colorScheme="dark">
                    <Box padding="3">
                      <Text>Nested dark scheme (replaces outer theme)</Text>
                      <Button size="sm">Nested</Button>
                    </Box>
                  </SilkProvider>
                </Stack>
              </div>
            ) : null}

            <div data-region="layout">
              <Stack gap="2" rail="start">
                <Text>Rail layout</Text>
                <Inline gap="2" direction="row-reverse" align="baseline">
                  <Text role="heading">H</Text>
                  <Text role="caption">caption</Text>
                </Inline>
              </Stack>
            </div>
          </Stack>
        </Box>
      </SilkProvider>
    </div>
  );
}
