import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';

test('createTheme returns light scheme defaults', () => {
  const theme = createTheme();

  expect(theme.colorScheme).toBe('light');
  expect(theme.semantic.color.tones.accent.solid).toBe(theme.palette.blue[9]);
  expect(theme.semantic.color.textSecondary).toBe(theme.palette.gray[11]);
  expect(theme.semantic.space[2]).toBe(8);
  expect(theme.semantic.radius.md).toBe(8);
});

test('createTheme deeply merges one tone leaf without clobbering siblings', () => {
  const theme = createTheme({
    semantic: {
      color: {
        tones: {
          accent: { solid: 'custom-solid' },
        },
      },
    },
  });

  expect(theme.semantic.color.tones.accent.solid).toBe('custom-solid');
  expect(theme.semantic.color.tones.accent.onSolid).toBe('#ffffff');
  expect(theme.semantic.color.tones.danger.solid).toBe(theme.palette.red[9]);
  expect(theme.semantic.color.surface).toBe('#ffffff');
});

test('palette override recomputes derived semantics; explicit semantic wins last', () => {
  const theme = createTheme({
    palette: { blue: { 9: '#0000ff' } },
    semantic: { color: { tones: { accent: { solid: 'kept-explicit' } } } },
  });

  expect(theme.palette.blue[9]).toBe('#0000ff');
  expect(theme.semantic.color.tones.accent.solid).toBe('kept-explicit');
  expect(theme.semantic.color.tones.accent.hover).toBe(theme.palette.blue[10]);
});

test('dark scheme uses dark palette and surfaces', () => {
  const theme = createTheme({ colorScheme: 'dark' });

  expect(theme.colorScheme).toBe('dark');
  expect(theme.semantic.color.surface).toBe(theme.palette.gray[1]);
  expect(theme.semantic.color.tones.accent.solid).toBe(theme.palette.blue[9]);
});
