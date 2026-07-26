import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Dialog } from '../components/Dialog';
import { Input } from '../components/Input';
import { ThemeProvider } from './ThemeProvider';
import { themeToCssVars } from './themeToCssVars';

test('partial createTheme overrides flow to CSS vars', () => {
  const theme = createTheme({
    semantic: {
      color: {
        surface: '#fafafa',
        tones: { accent: { solid: '#123456' } },
      },
    },
  });
  const vars = themeToCssVars(theme);
  expect(vars['--silk-color-surface']).toBe('#fafafa');
  expect(vars['--silk-color-tone-accent-solid']).toBe('#123456');
  expect(vars['--silk-color-tone-success-solid']).toBeDefined();
  expect(vars['--silk-shadow-raised']).toContain('rgba');
});

test('nested ThemeProviders: inner custom theme wins for descendants', () => {
  const outer = createTheme({
    semantic: { color: { surface: '#ffffff' } },
  });
  const inner = createTheme({
    semantic: { color: { surface: '#eeeeee' } },
  });

  const { container } = render(
    <ThemeProvider theme={outer}>
      <ThemeProvider theme={inner}>
        <Card data-testid="inner-card">Nested</Card>
      </ThemeProvider>
    </ThemeProvider>,
  );

  const outerScope = container.firstElementChild as HTMLElement;
  const innerScope = outerScope.firstElementChild as HTMLElement;
  expect(outerScope.style.getPropertyValue('--silk-color-surface')).toBe(
    '#ffffff',
  );
  expect(innerScope.style.getPropertyValue('--silk-color-surface')).toBe(
    '#eeeeee',
  );
  expect(innerScope.contains(screen.getByTestId('inner-card'))).toBe(true);
});

test('Stage 2 components render under named light and dark schemes', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const { unmount } = render(
      <ThemeProvider colorScheme={scheme}>
        <Button>Save</Button>
        <Badge tone="success">Ok</Badge>
        <Input aria-label="Name" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    unmount();
  }
});

test('Dialog portal reconstitutes theme for Stage 2 content', async () => {
  const theme = createTheme({
    colorScheme: 'dark',
    semantic: { color: { surfaceRaised: '#1a1a1a' } },
  });

  render(
    <ThemeProvider theme={theme}>
      <Dialog.Root open>
        <Dialog.Content>
          <Dialog.Title>Settings</Dialog.Title>
          <Input aria-label="Portal input" />
          <Badge tone="success">Live</Badge>
        </Dialog.Content>
      </Dialog.Root>
    </ThemeProvider>,
  );

  const input = await screen.findByLabelText('Portal input');
  expect(input).toBeTruthy();
  const portalScope = input.closest('[data-theme="dark"]');
  expect(portalScope).not.toBeNull();
});
