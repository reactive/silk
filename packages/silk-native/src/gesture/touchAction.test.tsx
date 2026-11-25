import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { Dialog } from '../components/Dialog/Dialog.js';
import { Pager } from '../components/Pager/Pager.js';
import { Switch } from '../components/Switch.js';
import { SilkProvider } from '../theme/SilkProvider.js';
import { type FlickDirection, useFlickGesture } from './flick.js';

// These run the real Gesture Handler, which writes each drag's touch-action on its view. A drag
// leaves the browser its panning across its axis, so a page still scrolls across it.

function Flicked({
  direction,
  enabled,
}: {
  readonly direction: FlickDirection;
  readonly enabled: boolean;
}): JSX.Element {
  const flick = useFlickGesture({ direction, onFlick: () => {}, enabled });
  return (
    <GestureDetector {...flick}>
      <View testID="flicked" />
    </GestureDetector>
  );
}

const touchAction = (testID: string) => screen.getByTestId(testID).style.touchAction;

test('a flick leaves the browser its panning across the flick', () => {
  const { rerender } = render(<Flicked direction="up" enabled />);
  expect(touchAction('flicked')).toBe('pan-x');
  rerender(<Flicked direction="left" enabled />);
  expect(touchAction('flicked')).toBe('pan-y');
  // Disabled, the browser keeps all its panning.
  rerender(<Flicked direction="up" enabled={false} />);
  expect(touchAction('flicked')).toBe('');
});

function Drags({ switchDisabled }: { readonly switchDisabled: boolean }): JSX.Element {
  return (
    <SilkProvider>
      <Pager.Root value="a" onValueChange={() => {}} testID="pager">
        <Pager.Page value="a">
          <View />
        </Pager.Page>
      </Pager.Root>
      <Switch
        checked={false}
        onCheckedChange={() => {}}
        accessibilityLabel="On"
        testID="switch"
        disabled={switchDisabled}
      />
      <Dialog.Root open>
        <Dialog.Content placement="bottom" testID="sheet">
          <Dialog.Title>Settings</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>
  );
}

test('a pager and a switch leave the browser its vertical panning, a sheet its sideways', () => {
  const { rerender } = render(<Drags switchDisabled={false} />);
  expect(touchAction('pager')).toBe('pan-y');
  expect(touchAction('switch')).toBe('pan-y');
  expect(touchAction('sheet')).toBe('pan-x');
  // A disabled switch leaves the browser all its panning.
  rerender(<Drags switchDisabled />);
  expect(touchAction('switch')).toBe('');
});
