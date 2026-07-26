import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Button } from './Button';
import { DropdownMenu } from './DropdownMenu';

test('open menu reconstitutes theme and lists items', async () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider colorScheme="dark">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button>Menu</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
          <DropdownMenu.Item tone="danger" shortcut="⌘⌫">
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </ThemeProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  expect(await screen.findByRole('menu')).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeTruthy();
  expect(screen.getByRole('menu').closest('[data-theme="dark"]')).not.toBeNull();
});

test('arrow keys move highlight between items', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>One</DropdownMenu.Item>
        <DropdownMenu.Item>Two</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  await screen.findByRole('menu');
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('menuitem', { name: 'One' }).getAttribute('data-highlighted')).toBe(
    '',
  );
});
