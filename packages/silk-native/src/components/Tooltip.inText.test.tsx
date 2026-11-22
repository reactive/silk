import { expect, rs, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Text } from './Text.js';
import { Tooltip } from './Tooltip.js';

// As on native inside a line of text, which the web never is.
rs.mock('#in-text', () => ({ useInText: () => true }));

test('inside a line of text, the trigger is a span of it, and a tap opens the tooltip', () => {
  const opened: boolean[] = [];
  render(
    <SilkProvider>
      <Text>
        {'Play '}
        <Tooltip.Root onOpenChange={(open) => opened.push(open)}>
          <Tooltip.Trigger testID="trigger">Bf5</Tooltip.Trigger>
          <Tooltip.Content>A small board</Tooltip.Content>
        </Tooltip.Root>
        {' next.'}
      </Text>
    </SilkProvider>,
  );
  const trigger = screen.getByTestId('trigger');
  // react-native-web draws a Text inside a Text as a span; a View would be a div.
  expect(trigger.tagName).toBe('SPAN');
  expect(trigger.textContent).toBe('Bf5');
  act(() => {
    fireEvent.click(trigger);
  });
  expect(screen.getByRole('tooltip').textContent).toBe('A small board');
  expect(opened).toEqual([true]);
});

test('inside a line of text, `open` with no tap shows nothing: there is no box to open beside', () => {
  render(
    <SilkProvider>
      <Text>
        <Tooltip.Root open>
          <Tooltip.Trigger>Bf5</Tooltip.Trigger>
          <Tooltip.Content>A small board</Tooltip.Content>
        </Tooltip.Root>
      </Text>
    </SilkProvider>,
  );
  expect(screen.queryByRole('tooltip')).toBeNull();
});
