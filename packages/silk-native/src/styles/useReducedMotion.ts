import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type MatchMedia = (query: string) => { matches: boolean };

function initialReducedMotion(): boolean {
  const matchMedia = (globalThis as { matchMedia?: MatchMedia }).matchMedia;
  if (typeof matchMedia === 'function') {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // Native exposes the preference only via async AccessibilityInfo — stay static
  // until resolved so motion effects never flash before the OS answer arrives.
  return true;
}

/**
 * Subscribe to the OS reduce-motion preference.
 * On react-native-web this resolves from `prefers-reduced-motion`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(initialReducedMotion);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
