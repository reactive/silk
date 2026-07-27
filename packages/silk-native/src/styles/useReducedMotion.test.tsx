import { expect, test } from '@rstest/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { useReducedMotion } from './useReducedMotion.js';

function Probe() {
  const reduced = useReducedMotion();
  return <div data-testid="reduced">{String(reduced)}</div>;
}

test('does not consult AccessibilityInfo when matchMedia is available', async () => {
  setPrefersReducedMotion(true);
  const original = AccessibilityInfo.isReduceMotionEnabled;
  let called = 0;
  AccessibilityInfo.isReduceMotionEnabled = () => {
    called += 1;
    return Promise.resolve(false);
  };

  try {
    render(<Probe />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(called).toBe(0);
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
