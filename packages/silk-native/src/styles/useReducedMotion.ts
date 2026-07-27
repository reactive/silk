import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Subscribe to the OS reduce-motion preference.
 * On react-native-web this resolves from `prefers-reduced-motion`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

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
