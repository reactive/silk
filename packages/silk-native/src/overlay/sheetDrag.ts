import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
  PanResponder,
  Platform,
} from 'react-native';

/** Share of the sheet's height it is dragged down to close on release. */
const CLOSE_SHARE = 0.3;
/** Downward speed, in points per millisecond, that closes a sheet let go of sooner. */
const CLOSE_SPEED = 0.5;
/** How far a press moves, mostly downward, before it is taken as dragging the sheet. */
const DRAG_START = 6;
/** How long the sheet slides off the screen once let go to close. */
const SLIDE_OUT_MS = 160;

/**
 * Whether a sheet let go of after dragging `dy` points down at `vy` points
 * per millisecond closes: dragged a share of its `height`, or flung down.
 */
export function releaseCloses(dy: number, vy: number, height: number): boolean {
  return dy > height * CLOSE_SHARE || (dy > 0 && vy > CLOSE_SPEED);
}

export interface SheetDrag {
  /** The sheet's offset down from where it rests. */
  readonly translateY: Animated.Value;
  readonly panHandlers: GestureResponderHandlers;
  /** Measures the sheet, for how far it is dragged and slides out. */
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * A bottom sheet's drag down to close: the sheet follows a press that moves
 * down on any part of it that doesn't take the press itself (a scroll view
 * that can scroll, a button), and once let go, slides off and calls `close`,
 * or settles back. `open` going true puts it back in place. With reduced
 * motion it closes or settles back at once.
 */
export function useSheetDrag(open: boolean, reduced: boolean, close: () => void): SheetDrag {
  const [translateY] = useState(() => new Animated.Value(0));
  const height = useRef(0);
  // The responder is made once, so it reads the latest of these.
  const latest = useRef({ reduced, close });
  useLayoutEffect(() => {
    latest.current = { reduced, close };
  });
  useEffect(() => {
    if (open) translateY.setValue(0);
  }, [open, translateY]);

  const [panHandlers] = useState(() => {
    const settle = () => {
      if (latest.current.reduced) translateY.setValue(0);
      else Animated.spring(translateY, { toValue: 0, useNativeDriver, bounciness: 0 }).start();
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => dy > DRAG_START && dy > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => translateY.setValue(Math.max(0, dy)),
      onPanResponderRelease: (_, { dy, vy }) => {
        if (!releaseCloses(dy, vy, height.current)) settle();
        else if (latest.current.reduced) latest.current.close();
        else
          Animated.timing(translateY, {
            toValue: height.current,
            duration: SLIDE_OUT_MS,
            useNativeDriver,
          }).start(({ finished }) => finished && latest.current.close());
      },
      onPanResponderTerminate: settle,
    }).panHandlers;
  });

  return {
    translateY,
    panHandlers,
    onLayout: ({ nativeEvent }) => {
      height.current = nativeEvent.layout.height;
    },
  };
}

/** react-native-web has no native driver, and warns when asked for it. */
const useNativeDriver = Platform.OS !== 'web';
