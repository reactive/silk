import { expect, test } from '@rstest/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { Spinner } from '../components/Spinner.js';
import { SilkProvider } from '../theme/SilkProvider.js';
import {
  resetNativeMotionPreference,
  useMotionPreference,
  useReducedMotion,
} from './useReducedMotion.js';

function Probe() {
  const reduced = useReducedMotion();
  return <div data-testid="reduced">{String(reduced)}</div>;
}

function PreferenceProbe() {
  return <div data-testid="preference">{useMotionPreference()}</div>;
}

/**
 * Emulate real React Native: no `matchMedia`, the OS preference readable only
 * through async `AccessibilityInfo`, and no answer cached by an earlier test.
 */
async function onNative(
  reduceMotionEnabled: () => Promise<boolean>,
  run: () => Promise<void>,
): Promise<void> {
  const originalMatchMedia = globalThis.matchMedia;
  const originalQuery = AccessibilityInfo.isReduceMotionEnabled;
  // @ts-expect-error -- removing the jsdom polyfill to exercise the RN path
  delete globalThis.matchMedia;
  AccessibilityInfo.isReduceMotionEnabled = reduceMotionEnabled;
  resetNativeMotionPreference();
  try {
    await run();
  } finally {
    globalThis.matchMedia = originalMatchMedia;
    AccessibilityInfo.isReduceMotionEnabled = originalQuery;
    resetNativeMotionPreference();
  }
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

test('native reports unresolved before AccessibilityInfo answers, then the OS value', async () => {
  await onNative(() => Promise.resolve(false), async () => {
    render(<PreferenceProbe />);
    expect(screen.getByTestId('preference').textContent).toBe('unresolved');
    await flush();
    expect(screen.getByTestId('preference').textContent).toBe('full');
  });
});

test('native suppresses motion while the preference is unresolved', async () => {
  await onNative(() => Promise.resolve(false), async () => {
    render(<Probe />);
    expect(screen.getByTestId('reduced').textContent).toBe('true');
  });
});

test('native Spinner does not flash the reduced-motion ring before resolving', async () => {
  await onNative(() => Promise.resolve(false), async () => {
    render(
      <SilkProvider>
        <Spinner label="Loading" testID="spin" />
      </SilkProvider>,
    );
    const el = screen.getByTestId('spin');
    expect(el.style.getPropertyValue('border-top-style')).toBe('solid');
    await flush();
    expect(el.style.getPropertyValue('border-top-style')).toBe('solid');
  });
});

test('native Spinner adopts the reduced ring once the OS confirms it', async () => {
  await onNative(() => Promise.resolve(true), async () => {
    render(
      <SilkProvider>
        <Spinner label="Loading" testID="spin" />
      </SilkProvider>,
    );
    await flush();
    expect(
      screen.getByTestId('spin').style.getPropertyValue('border-top-style'),
    ).toBe('dotted');
  });
});

test('native remounts use the cached preference synchronously', async () => {
  let called = 0;
  await onNative(() => {
    called += 1;
    return Promise.resolve(true);
  }, async () => {
    const first = render(<PreferenceProbe />);
    await flush();
    expect(screen.getByTestId('preference').textContent).toBe('reduced');
    first.unmount();

    render(<PreferenceProbe />);
    // Cached answer — never flashes `'unresolved'` again.
    expect(screen.getByTestId('preference').textContent).toBe('reduced');
    expect(called).toBeGreaterThanOrEqual(1);
  });
});

test('native event updates are not overwritten by a slower bootstrap query', async () => {
  let resolveQuery!: (value: boolean) => void;
  const originalAdd = AccessibilityInfo.addEventListener;
  let onChange: ((enabled: boolean) => void) | undefined;
  AccessibilityInfo.addEventListener = ((eventName, handler) => {
    if (eventName === 'reduceMotionChanged') {
      onChange = handler as (enabled: boolean) => void;
      return {
        remove: () => {
          onChange = undefined;
        },
      };
    }
    return originalAdd.call(AccessibilityInfo, eventName, handler);
  }) as typeof AccessibilityInfo.addEventListener;

  try {
    await onNative(
      () =>
        new Promise<boolean>((resolve) => {
          resolveQuery = resolve;
        }),
      async () => {
        render(<PreferenceProbe />);
        expect(screen.getByTestId('preference').textContent).toBe('unresolved');

        act(() => {
          onChange?.(true);
        });
        expect(screen.getByTestId('preference').textContent).toBe('reduced');

        await act(async () => {
          resolveQuery(false);
          await Promise.resolve();
        });
        expect(screen.getByTestId('preference').textContent).toBe('reduced');
      },
    );
  } finally {
    AccessibilityInfo.addEventListener = originalAdd;
  }
});

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
    await flush();
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
