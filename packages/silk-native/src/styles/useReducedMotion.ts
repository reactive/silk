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

/**
 * OS reduce-motion preference.
 * `'unresolved'` only occurs on real React Native before async
 * `AccessibilityInfo` answers.
 */
export type MotionPreference = 'full' | 'reduced' | 'unresolved';

let nativePreference: MotionPreference = 'unresolved';
let nativeQuery: Promise<MotionPreference> | undefined;
/** Bumped by live OS events so an in-flight bootstrap cannot clobber them. */
let nativeEpoch = 0;

function toPreference(reduced: boolean): MotionPreference {
  return reduced ? 'reduced' : 'full';
}

/** Shared in-flight query; settled answers refresh `nativePreference`. */
function queryNative(): Promise<MotionPreference> {
  if (!nativeQuery) {
    const epoch = nativeEpoch;
    nativeQuery = AccessibilityInfo.isReduceMotionEnabled()
      // Preference unreadable — fail open to full motion rather than sticking
      // on `'unresolved'`.
      .catch(() => false)
      .then((enabled) => {
        nativeQuery = undefined;
        if (epoch !== nativeEpoch) {
          return nativePreference;
        }
        nativePreference = toPreference(enabled);
        return nativePreference;
      });
  }
  return nativeQuery;
}

/** Test-only: drop the cached native answer. Not part of the public API. */
export function resetNativeMotionPreference(): void {
  nativePreference = 'unresolved';
  nativeQuery = undefined;
  nativeEpoch = 0;
}

function initialPreference(): MotionPreference {
  const matchMedia = getMatchMedia();
  if (matchMedia) {
    return toPreference(matchMedia(REDUCED_MOTION_QUERY).matches);
  }
  return nativePreference;
}

/**
 * Subscribe to the OS reduce-motion preference.
 * On react-native-web this resolves synchronously from `prefers-reduced-motion`;
 * on React Native the first mount reports `'unresolved'` until
 * `AccessibilityInfo` answers.
 */
export function useMotionPreference(): MotionPreference {
  const [preference, setPreference] = useState(initialPreference);

  useEffect(() => {
    const matchMedia = getMatchMedia();
    if (matchMedia) {
      // Prefer live matchMedia on web/RNW — AccessibilityInfo may disagree when
      // matchMedia is mocked/emulated after RNW captures its MediaQueryList.
      const mql = matchMedia(REDUCED_MOTION_QUERY);
      const onChange = (event: { matches: boolean }) => {
        setPreference(toPreference(event.matches));
      };
      setPreference(toPreference(mql.matches));
      mql.addEventListener('change', onChange);
      return () => {
        mql.removeEventListener('change', onChange);
      };
    }

    let mounted = true;
    void queryNative().then((next) => {
      if (mounted) setPreference(next);
    });
    const onNativeChange = (enabled: boolean) => {
      nativeEpoch += 1;
      nativePreference = toPreference(enabled);
      setPreference(nativePreference);
    };
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      onNativeChange,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return preference;
}

/**
 * `true` whenever motion must be suppressed, including the brief native
 * window before the OS preference resolves. Components that also swap in a
 * distinct reduced-motion *appearance* should use {@link useMotionPreference}
 * so those visuals wait for a confirmed `'reduced'`.
 */
export function useReducedMotion(): boolean {
  return useMotionPreference() !== 'full';
}
