import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { View } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Button } from './Button.js';

test('Button has accessibilityRole button and accessible name', () => {
  render(
    <SilkProvider>
      <Button>Save</Button>
    </SilkProvider>,
  );
  expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
});

test('Button disabled sets accessibilityState and suppresses press', () => {
  let pressed = 0;
  render(
    <SilkProvider>
      <Button disabled onPress={() => { pressed += 1; }}>
        Locked
      </Button>
    </SilkProvider>,
  );
  const button = screen.getByRole('button', { name: 'Locked' });
  expect(button.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(button);
  expect(pressed).toBe(0);
});

test('Button press activation fires onPress', () => {
  let pressed = 0;
  render(
    <SilkProvider>
      <Button onPress={() => { pressed += 1; }}>Go</Button>
    </SilkProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Go' }));
  expect(pressed).toBe(1);
});

test('Button ref targets the host', () => {
  const ref = createRef<View>();
  render(
    <SilkProvider>
      <Button ref={ref}>Ref</Button>
    </SilkProvider>,
  );
  expect(ref.current).toBeTruthy();
});

test('style escape hatch accepts object consumer styles', () => {
  render(
    <SilkProvider>
      <Button style={{ opacity: 0.5 }} testID="styled">
        Styled
      </Button>
    </SilkProvider>,
  );
  expect(screen.getByTestId('styled')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Styled' })).toBeTruthy();
});

test('disabled prop wins over consumer accessibilityState.disabled', () => {
  render(
    <SilkProvider>
      <Button disabled accessibilityState={{ disabled: false }}>
        Locked
      </Button>
    </SilkProvider>,
  );
  expect(
    screen.getByRole('button', { name: 'Locked' }).getAttribute('aria-disabled'),
  ).toBe('true');
});
