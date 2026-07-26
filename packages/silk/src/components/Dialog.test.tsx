import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import type { CSSProperties, JSX } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Dialog } from './Dialog';

function OpenDialog({
  size = 'md',
  container,
}: {
  readonly size?: 'sm' | 'md' | 'lg' | 'full';
  readonly container?: HTMLElement | null;
}): JSX.Element {
  return (
    <Dialog.Root open>
      <Dialog.Content size={size} container={container}>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function portalScope(dialog: HTMLElement): HTMLElement {
  const parent = dialog.parentElement;
  if (!parent) {
    throw new Error('expected dialog to have a theme scope parent');
  }
  return parent;
}

function expectSharedThemeClass(
  providerRoot: HTMLElement,
  scope: HTMLElement,
): void {
  for (const className of providerRoot.className.split(/\s+/).filter(Boolean)) {
    expect(scope.className.split(/\s+/)).toContain(className);
  }
}

test('body-portaled dialog reconstitutes named dark theme scope', () => {
  const { container } = render(
    <ThemeProvider colorScheme="dark">
      <OpenDialog />
    </ThemeProvider>,
  );

  const providerRoot = container.firstElementChild as HTMLElement;
  const dialog = screen.getByRole('dialog');
  const scope = portalScope(dialog);

  expect(scope.getAttribute('data-theme')).toBe('dark');
  expectSharedThemeClass(providerRoot, scope);
  expect(providerRoot.contains(dialog)).toBe(false);
  expect(document.body.contains(dialog)).toBe(true);
});

test('system scheme omits data-theme on portal scope', () => {
  const { container } = render(
    <ThemeProvider colorScheme="system">
      <OpenDialog />
    </ThemeProvider>,
  );

  const providerRoot = container.firstElementChild as HTMLElement;
  const scope = portalScope(screen.getByRole('dialog'));

  expect(providerRoot.hasAttribute('data-theme')).toBe(false);
  expect(scope.hasAttribute('data-theme')).toBe(false);
  expectSharedThemeClass(providerRoot, scope);
});

test('nested provider wins for body-portaled dialog', () => {
  render(
    <ThemeProvider colorScheme="light">
      <ThemeProvider colorScheme="dark">
        <OpenDialog />
      </ThemeProvider>
    </ThemeProvider>,
  );

  const scope = portalScope(screen.getByRole('dialog'));
  expect(scope.getAttribute('data-theme')).toBe('dark');
});

test('custom theme css vars appear on portal scope without consumer layout styles', () => {
  const theme = createTheme({
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });

  const { container } = render(
    <ThemeProvider
      theme={theme}
      style={{ padding: '24px', backgroundColor: 'salmon' }}
    >
      <OpenDialog />
    </ThemeProvider>,
  );

  const providerRoot = container.firstElementChild as HTMLElement;
  const scope = portalScope(screen.getByRole('dialog'));

  expect(scope.style.getPropertyValue('--silk-color-surface')).toBe(
    'rgb(1, 2, 3)',
  );
  expect(scope.style.padding).toBe('');
  expect(scope.style.backgroundColor).toBe('');
  expect(providerRoot.style.padding).toBe('24px');
});

test('style attribute --silk-* overrides propagate to portal scope', () => {
  render(
    <ThemeProvider
      colorScheme="light"
      style={
        {
          padding: '24px',
          '--silk-color-surface': 'rgb(9, 8, 7)',
        } as CSSProperties
      }
    >
      <OpenDialog />
    </ThemeProvider>,
  );

  const scope = portalScope(screen.getByRole('dialog'));
  expect(scope.style.getPropertyValue('--silk-color-surface')).toBe(
    'rgb(9, 8, 7)',
  );
  expect(scope.style.padding).toBe('');
});

test('explicit container still hosts a single theme scope wrapper', () => {
  const host = document.createElement('div');
  document.body.append(host);

  try {
    render(
      <ThemeProvider colorScheme="dark">
        <OpenDialog container={host} />
      </ThemeProvider>,
    );

    const dialog = screen.getByRole('dialog');
    const scope = portalScope(dialog);

    expect(host.contains(dialog)).toBe(true);
    expect(scope.parentElement).toBe(host);
    expect(scope.getAttribute('data-theme')).toBe('dark');
    expect(host.querySelectorAll('[data-theme="dark"]').length).toBe(1);
  } finally {
    host.remove();
  }
});
