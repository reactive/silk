import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Popover } from './Popover';

function OpenPopover({ size = 'md' }: { readonly size?: 'sm' | 'md' | 'lg' }): JSX.Element {
  return (
    <Popover.Root open>
      <Popover.Trigger asChild>
        <Button>Open</Button>
      </Popover.Trigger>
      <Popover.Content size={size}>Popover body</Popover.Content>
    </Popover.Root>
  );
}

test('body-portaled popover reconstitutes dark theme scope', () => {
  render(
    <ThemeProvider colorScheme="dark">
      <OpenPopover />
    </ThemeProvider>,
  );

  const dialog = screen.getByText('Popover body');
  expect(dialog.closest('[data-theme="dark"]')).not.toBeNull();
  expect(dialog.getAttribute('data-size')).toBe('md');
});

test('escape closes controlled popover via keyboard', async () => {
  const user = userEvent.setup();
  let open = true;
  const onOpenChange = (next: boolean): void => {
    open = next;
  };

  const { rerender } = render(
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <Button>Open</Button>
      </Popover.Trigger>
      <Popover.Content>Closeable</Popover.Content>
    </Popover.Root>,
  );

  expect(screen.getByText('Closeable')).toBeTruthy();
  await user.keyboard('{Escape}');
  expect(open).toBe(false);

  rerender(
    <Popover.Root open={false} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <Button>Open</Button>
      </Popover.Trigger>
      <Popover.Content>Closeable</Popover.Content>
    </Popover.Root>,
  );
  expect(screen.queryByText('Closeable')).toBeNull();
});
