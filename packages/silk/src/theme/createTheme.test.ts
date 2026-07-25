import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme';

test('createTheme returns default semantic tokens', () => {
  const theme = createTheme();

  expect(theme.semantic.accent).toBe('#2563eb');
  expect(theme.semantic.textSecondary).toBe(theme.palette.gray);
  expect(theme.semantic.danger).toBe(theme.palette.red);
});

test('createTheme merges palette and semantic overrides', () => {
  const theme = createTheme({
    palette: { blue: '#0000ff' },
    semantic: { accent: 'custom-accent' },
  });

  expect(theme.palette.blue).toBe('#0000ff');
  expect(theme.semantic.accent).toBe('custom-accent');
});
