import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { View } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Box } from './Box.js';
import { Inline } from './Inline.js';
import { Stack } from './Stack.js';
import { Text } from './Text.js';

test('Box/Stack/Inline/Text render children and accept style escape hatch', () => {
  render(
    <SilkProvider>
      <Box padding="2" style={{ opacity: 0.9 }} testID="box">
        <Stack gap="2" rail="start" testID="stack">
          <Inline gap="1" direction="row-reverse" testID="inline">
            <Text role="heading" measure="prose" testID="text">
              Hello
            </Text>
          </Inline>
        </Stack>
      </Box>
    </SilkProvider>,
  );
  expect(screen.getByTestId('box')).toBeTruthy();
  expect(screen.getByTestId('stack')).toBeTruthy();
  expect(screen.getByTestId('inline')).toBeTruthy();
  expect(screen.getByText('Hello')).toBeTruthy();
});

test('layout refs target View hosts', () => {
  const boxRef = createRef<View>();
  const stackRef = createRef<View>();
  render(
    <SilkProvider>
      <Box ref={boxRef}>
        <Stack ref={stackRef}>
          <Text>x</Text>
        </Stack>
      </Box>
    </SilkProvider>,
  );
  expect(boxRef.current).toBeTruthy();
  expect(stackRef.current).toBeTruthy();
});
