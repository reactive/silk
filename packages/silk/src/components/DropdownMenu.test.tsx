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

test('menu item renders children and shortcut', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item shortcut="⌘K">Edit</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  const item = await screen.findByRole('menuitem');
  expect(item.textContent).toContain('Edit');
  expect(item.textContent).toContain('⌘K');
});

test('menu item composes with asChild without dropping the shortcut', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item asChild shortcut="⌘K">
          <a href="#edit" data-testid="custom-item">
            Edit
          </a>
        </DropdownMenu.Item>
        <DropdownMenu.Item asChild>
          <a href="#plain" data-testid="plain-item">
            Plain
          </a>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  await screen.findByRole('menu');

  const item = screen.getByTestId('custom-item');
  expect(item.getAttribute('role')).toBe('menuitem');
  expect(item.textContent).toContain('Edit');
  expect(item.textContent).toContain('⌘K');

  // No shortcut still renders through the same Slottable path.
  expect(screen.getByTestId('plain-item').textContent).toBe('Plain');
});

test('sub trigger composes with asChild without dropping the caret', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger asChild>
            <div data-testid="custom-sub">More</div>
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Deep</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  await screen.findByRole('menu');

  const subTrigger = screen.getByTestId('custom-sub');
  expect(subTrigger.getAttribute('role')).toBe('menuitem');
  expect(subTrigger.textContent).toContain('More');
  expect(subTrigger.textContent).toContain('›');
});

test('sub trigger renders children and caret by default', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Deep</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );

  await user.click(screen.getByRole('button', { name: 'Menu' }));
  const subTrigger = await screen.findByRole('menuitem');
  expect(subTrigger.textContent).toContain('More');
  expect(subTrigger.textContent).toContain('›');
});
