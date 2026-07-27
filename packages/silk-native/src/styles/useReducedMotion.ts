import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type MediaQueryListLike = {
  matches: boolean;
  addEventListener: (
    type: 'change',
    listener: (event: { matches: boolean }) => void,
  ) => void;
  removeEventListener: (
    type: 'change',
    listener: (event: { matches: boolean }) => void,
  ) => void;
};

type MatchMedia = (query: string) => MediaQueryListLike;

function getMatchMedia(): MatchMedia | undefined {
  const matchMedia = (globalThis as { matchMedia?: MatchMedia }).matchMedia;
  return typeof matchMedia === 'function' ? matchMedia : undefined;
}

function initialReducedMotion(): boolean {
  const matchMedia = getMatchMedia();
  if (matchMedia) {
    return matchMedia(REDUCED_MOTION_QUERY).matches;
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
    const matchMedia = getMatchMedia();
    if (matchMedia) {
      // Prefer live matchMedia on web/RNW — AccessibilityInfo may disagree when
      // matchMedia is mocked/emulated after RNW captures its MediaQueryList.
      const mql = matchMedia(REDUCED_MOTION_QUERY);
      const onChange = (event: { matches: boolean }) => {
        setReduced(event.matches);
      };
      setReduced(mql.matches);
      mql.addEventListener('change', onChange);
      return () => {
        mql.removeEventListener('change', onChange);
      };
    }

    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled);
      })
      .catch(() => {
        // Preference unreadable — allow motion instead of staying stuck on the
        // optimistic reduced-motion default used to avoid a first-frame flash.
        if (mounted) setReduced(false);
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
