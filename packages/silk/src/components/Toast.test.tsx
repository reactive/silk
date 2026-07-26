import { expect, test } from '@rstest/core';
import { render, screen, waitFor } from '@testing-library/react';
import { useState, type JSX } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { loadDistCss } from '../test/distCss';
import { Toast } from './Toast';

function ToastDemo({
  initialOpen = true,
}: {
  readonly initialOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(initialOpen);
  return (
    <Toast.Provider>
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        tone="success"
        duration={Number.POSITIVE_INFINITY}
      >
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes were stored.</Toast.Description>
        <Toast.Action altText="Undo save" onClick={() => setOpen(false)}>
          Undo
        </Toast.Action>
        <Toast.Close aria-label="Dismiss" />
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  );
}

test('toast viewport reconstitutes theme and exposes status', () => {
  render(
    <ThemeProvider colorScheme="dark">
      <ToastDemo />
    </ThemeProvider>,
  );

  expect(screen.getByText('Saved')).toBeTruthy();
  expect(
    screen.getByText('Saved').closest('[data-theme="dark"]'),
  ).not.toBeNull();
});

test('toast swipe and close layout use Radix CSS vars and a close grid area', () => {
  const css = loadDistCss();
  expect(css).toContain('--radix-toast-swipe-move-x');
  expect(css).toContain('--radix-toast-swipe-move-y');
  expect(css).toContain('--radix-toast-swipe-end-x');
  expect(css).toContain('--radix-toast-swipe-end-y');
  expect(css).toContain('grid-area: close');
  expect(css).not.toContain('--silk-toast-swipe-x');
});

test('toast onOpenChange closes when open becomes false', async () => {
  function Controlled(): JSX.Element {
    const [open, setOpen] = useState(true);
    return (
      <Toast.Provider>
        <button type="button" onClick={() => setOpen(false)}>
          Hide
        </button>
        <Toast.Root
          open={open}
          onOpenChange={setOpen}
          duration={Number.POSITIVE_INFINITY}
        >
          <Toast.Title>Saved</Toast.Title>
        </Toast.Root>
        <Toast.Viewport />
      </Toast.Provider>
    );
  }

  const { getByRole, queryByText } = render(<Controlled />);
  expect(screen.getByText('Saved')).toBeTruthy();
  getByRole('button', { name: 'Hide' }).click();
  await waitFor(() => {
    expect(queryByText('Saved')).toBeNull();
  });
});
