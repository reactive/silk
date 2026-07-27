import { expect, test } from '@rstest/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { useReducedMotion } from './useReducedMotion.js';

function Probe() {
  const reduced = useReducedMotion();
  return <div data-testid="reduced">{String(reduced)}</div>;
}

test('keeps matchMedia reduced-motion when AccessibilityInfo resolves false', async () => {
  setPrefersReducedMotion(true);
  let resolveAccessibility!: (enabled: boolean) => void;
  const accessibilityPromise = new Promise<boolean>((resolve) => {
    resolveAccessibility = resolve;
  });
  const original = AccessibilityInfo.isReduceMotionEnabled;
  AccessibilityInfo.isReduceMotionEnabled = () => accessibilityPromise;

  try {
    render(<Probe />);
    expect(screen.getByTestId('reduced').textContent).toBe('true');

    await act(async () => {
      resolveAccessibility(false);
      await accessibilityPromise;
    });

    expect(screen.getByTestId('reduced').textContent).toBe('true');
  } finally {
    AccessibilityInfo.isReduceMotionEnabled = original;
  }
});

test('updates when prefers-reduced-motion media query changes', async () => {
  setPrefersReducedMotion(false);
  render(<Probe />);
  expect(screen.getByTestId('reduced').textContent).toBe('false');

  setPrefersReducedMotion(true);
  await waitFor(() => {
    expect(screen.getByTestId('reduced').textContent).toBe('true');
  });

  setPrefersReducedMotion(false);
  await waitFor(() => {
    expect(screen.getByTestId('reduced').textContent).toBe('false');
  });
});
