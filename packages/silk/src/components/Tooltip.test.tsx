import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { expectNoAxeViolations } from '../test/a11y';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

function OpenTooltip(): JSX.Element {
  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root open>
        <Tooltip.Trigger asChild>
          <Button>Hover me</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Tip text</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

test('body-portaled tooltip reconstitutes dark theme scope', () => {
  const { container } = render(
    <ThemeProvider colorScheme="dark">
      <OpenTooltip />
    </ThemeProvider>,
  );

  const tip = screen.getByRole('tooltip');
  expect(tip.closest('[data-theme="dark"]')).not.toBeNull();
  expect(container.firstElementChild?.contains(tip)).toBe(false);
  expect(document.body.contains(tip)).toBe(true);
});

test('custom theme css vars appear on tooltip portal scope', () => {
  const theme = createTheme({
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });

  render(
    <ThemeProvider theme={theme}>
      <OpenTooltip />
    </ThemeProvider>,
  );

  const tip = screen.getByRole('tooltip');
  let scope: HTMLElement | null = tip.parentElement;
  while (
    scope &&
    !scope.style.getPropertyValue('--silk-color-surface')
  ) {
    scope = scope.parentElement;
  }
  expect(scope?.style.getPropertyValue('--silk-color-surface')).toBe(
    'rgb(1, 2, 3)',
  );
});

test('tooltip trigger exposes accessible name and has no axe violations', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button>Info</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Details</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>,
  );

  const trigger = screen.getByRole('button', { name: 'Info' });
  await user.hover(trigger);
  expect((await screen.findByRole('tooltip')).textContent).toBe('Details');
  await expectNoAxeViolations(container);
});
