import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';

test('createTheme returns light scheme defaults', () => {
  const theme = createTheme();

  expect(theme.colorScheme).toBe('light');
  // Light solid uses step 11 for WCAG 4.5:1 with white onSolid.
  expect(theme.semantic.color.tones.accent.solid).toBe(theme.palette.blue[11]);
  expect(theme.semantic.color.tones.success.solid).toBe(theme.palette.green[11]);
  expect(theme.semantic.color.surfaceSunken).toBe(theme.palette.gray[3]);
  expect(theme.semantic.color.overlay).toContain('rgba');
  expect(theme.semantic.shadow.raised.blur).toBe(12);
  expect(theme.semantic.focusRing.width).toBe(2);
  expect(theme.semantic.focusRing.offset).toBe(2);
  expect(theme.semantic.color.tones.accent.subtleHover).not.toBe(
    theme.semantic.color.tones.accent.subtle,
  );
  expect(theme.semantic.color.tones.accent.subtleActive).not.toBe(
    theme.semantic.color.tones.accent.subtleHover,
  );
  expect(theme.semantic.typography.headingSm.size).toBe(16);
  expect(theme.semantic.typography.headingXl.size).toBe(36);
  expect(theme.semantic.typography.body.family).toBe('sans');
  expect(theme.semantic.typography.headingLg.family).toBe('serif');
  expect(theme.semantic.typography.headingXl.family).toBe('serif');
  expect(theme.semantic.fontFamily.sans).toContain('Inter');
  expect(theme.semantic.fontFamily.serif).toContain('Source Serif 4');
  expect(theme.semantic.fontFamily.mono).toContain('JetBrains Mono');
  expect(theme.semantic.color.textSecondary).toBe(theme.palette.gray[11]);
  expect(theme.semantic.space[2]).toBe(8);
  expect(theme.semantic.radius.md).toBe(8);
});

test('fontFamily override retargets stacks without changing role assignments', () => {
  const theme = createTheme({
    semantic: {
      fontFamily: { sans: 'Custom Sans, sans-serif' },
    },
  });

  expect(theme.semantic.fontFamily.sans).toBe('Custom Sans, sans-serif');
  expect(theme.semantic.fontFamily.serif).toContain('Source Serif 4');
  expect(theme.semantic.typography.body.family).toBe('sans');
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
  expect(theme.semantic.color.tones.danger.solid).toBe(theme.palette.red[11]);
  expect(theme.semantic.color.surface).toBe('#ffffff');
});

test('palette override recomputes derived semantics; explicit semantic wins last', () => {
  const theme = createTheme({
    palette: { blue: { 9: '#0000ff' } },
    semantic: { color: { tones: { accent: { solid: 'kept-explicit' } } } },
  });

  expect(theme.palette.blue[9]).toBe('#0000ff');
  expect(theme.semantic.color.tones.accent.solid).toBe('kept-explicit');
  // Light hover is blended between steps 11 and 12, so it matches neither.
  const { hover, active } = theme.semantic.color.tones.accent;
  expect(active).toBe(theme.palette.blue[12]);
  expect(hover).not.toBe(theme.palette.blue[11]);
  expect(hover).not.toBe(active);
});

test('dark scheme uses dark palette and surfaces', () => {
  const theme = createTheme({ colorScheme: 'dark' });

  expect(theme.colorScheme).toBe('dark');
  expect(theme.semantic.color.surface).toBe(theme.palette.gray[1]);
  expect(theme.semantic.color.tones.accent.solid).toBe(theme.palette.blue[9]);
  expect(theme.semantic.color.tones.success.solid).toBe(theme.palette.green[9]);
  expect(theme.semantic.color.surfaceSunken).toBe(theme.palette.gray[3]);
});
