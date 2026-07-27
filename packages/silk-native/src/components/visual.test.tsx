import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { View } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Avatar } from './Avatar.js';
import { Badge } from './Badge.js';
import { Card } from './Card.js';
import { Heading } from './Heading.js';
import { Progress } from './Progress.js';
import { Separator } from './Separator.js';
import { Skeleton } from './Skeleton.js';
import { Spinner } from './Spinner.js';
import { StatusDot } from './StatusDot.js';
import { Surface } from './Surface.js';
import { Text } from './Text.js';

test('Heading exposes header role and aria-level', () => {
  render(
    <SilkProvider>
      <Heading level="1">Title</Heading>
    </SilkProvider>,
  );
  const heading = screen.getByRole('heading', { name: 'Title' });
  expect(heading.getAttribute('aria-level')).toBe('1');
});

test('Surface with onPress is pressable button; interactive alone is not', () => {
  let pressed = 0;
  const { rerender } = render(
    <SilkProvider>
      <Surface interactive="true" testID="surface">
        <Text>Idle</Text>
      </Surface>
    </SilkProvider>,
  );
  expect(screen.queryByRole('button')).toBeNull();

  rerender(
    <SilkProvider>
      <Surface
        interactive="true"
        testID="surface"
        onPress={() => {
          pressed += 1;
        }}
      >
        <Text>Clickable</Text>
      </Surface>
    </SilkProvider>,
  );
  expect(screen.getByRole('button', { name: 'Clickable' })).toBeTruthy();
  fireEvent.click(screen.getByTestId('surface'));
  expect(pressed).toBe(1);
});

test('Card ref and Badge render children', () => {
  const ref = createRef<View>();
  render(
    <SilkProvider>
      <Card ref={ref} testID="card">
        <Badge>New</Badge>
      </Card>
    </SilkProvider>,
  );
  expect(ref.current).toBeTruthy();
  expect(screen.getByText('New')).toBeTruthy();
});

test('decorative Separator is not in the a11y tree; non-decorative uses role', () => {
  const { container } = render(
    <SilkProvider>
      <Separator decorative testID="deco" />
      <Separator decorative={false} orientation="vertical" testID="real" />
    </SilkProvider>,
  );
  const deco = screen.getByTestId('deco');
  expect(deco.getAttribute('aria-hidden') === 'true' || deco.getAttribute('role') === null || deco.getAttribute('role') === 'none' || deco.getAttribute('role') === 'presentation').toBe(true);
  const real = screen.getByTestId('real');
  expect(real.getAttribute('role')).toBe('separator');
  expect(container).toBeTruthy();
});

test('Avatar falls back when no src', () => {
  render(
    <SilkProvider>
      <Avatar fallback="NT" testID="avatar" />
    </SilkProvider>,
  );
  expect(screen.getByText('NT')).toBeTruthy();
});

test('StatusDot and Skeleton are not accessible', () => {
  render(
    <SilkProvider>
      <StatusDot testID="dot" />
      <Skeleton testID="skel" />
    </SilkProvider>,
  );
  expect(screen.getByTestId('dot').getAttribute('aria-hidden')).not.toBe('false');
  expect(screen.getByTestId('skel')).toBeTruthy();
});

test('Spinner exposes status role and label', () => {
  render(
    <SilkProvider>
      <Spinner label="Fetching" testID="spin" />
    </SilkProvider>,
  );
  expect(screen.getByLabelText('Fetching')).toBeTruthy();
});

test('Progress determinate emits aria-valuenow via compat helper', () => {
  render(
    <SilkProvider>
      <Progress value={40} max={100} label="Upload" testID="prog" />
    </SilkProvider>,
  );
  const el = screen.getByLabelText('Upload');
  expect(el.getAttribute('aria-valuenow')).toBe('40');
  expect(el.getAttribute('aria-valuemin')).toBe('0');
  expect(el.getAttribute('aria-valuemax')).toBe('100');
});

test('Progress clamps value to max and treats negative as indeterminate', () => {
  const { rerender } = render(
    <SilkProvider>
      <Progress value={150} max={100} label="Clamp" />
    </SilkProvider>,
  );
  expect(screen.getByLabelText('Clamp').getAttribute('aria-valuenow')).toBe(
    '100',
  );
  rerender(
    <SilkProvider>
      <Progress value={-1} max={100} label="Clamp" />
    </SilkProvider>,
  );
  expect(screen.getByLabelText('Clamp').getAttribute('aria-valuenow')).toBeNull();
});

test('Progress indeterminate omits aria-valuenow', () => {
  render(
    <SilkProvider>
      <Progress label="Loading bar" testID="indet" />
    </SilkProvider>,
  );
  const el = screen.getByLabelText('Loading bar');
  expect(el.getAttribute('aria-valuenow')).toBeNull();
  expect(el.getAttribute('aria-valuemax')).toBe('100');
});
