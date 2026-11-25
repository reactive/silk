import { startTransition, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface OwnerReports<T> {
  /**
   * How many reports React has heard. Send it to the UI thread with the
   * owner's state, and render after each report, so a state the owner turned
   * down (rendered unchanged) is sent again.
   */
  readonly heard: number;
  /** A worklet: tells the owner `value`, once, numbering the report. */
  readonly report: (value: T) => void;
  /**
   * A worklet: whether owner state rendered after `heard` reports is older
   * than the UI thread's own, as when React hasn't yet heard where a release
   * went. Such state is kept out.
   */
  readonly stale: (heard: number) => boolean;
}

/**
 * The handshake between a part the UI thread moves (a pager, a switch's
 * thumb) and its controlled owner. The UI thread decides where a release
 * lands and reports it once; the owner answers by rendering, taking it or
 * not. Each report is numbered, and the owner's state goes back to the UI
 * thread with the number of reports React had heard, so state from before an
 * answer can't move the part back while a report is on its way.
 *
 * The count is state set in a transition, so it commits with an owner's
 * answer given in one (a router), and never with the state from before that
 * answer; it is set before `onReport`, so an owner that throws still renders
 * it.
 */
export function useOwnerReports<T>(onReport: (value: T) => void): OwnerReports<T> {
  // How many reports the UI thread has sent.
  const reported = useSharedValue(0);
  const [heard, setHeard] = useState(0);
  const latest = useRef(onReport);
  useLayoutEffect(() => {
    latest.current = onReport;
  });
  const [deliver] = useState(() => (value: T, count: number) => {
    startTransition(() => setHeard(count));
    latest.current(value);
  });
  const worklets = useMemo(
    () => ({
      report: (value: T) => {
        'worklet';
        const count = reported.get() + 1;
        reported.set(count);
        scheduleOnRN(deliver, value, count);
      },
      stale: (count: number) => {
        'worklet';
        return count < reported.get();
      },
    }),
    [reported, deliver],
  );
  return { heard, ...worklets };
}
