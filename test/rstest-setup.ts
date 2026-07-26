import { afterEach } from '@rstest/core';
import { cleanup } from '@testing-library/react';

/**
 * Shared jsdom polyfills and test lifecycle for package and docs tests.
 * Radix Slider (and similar) require ResizeObserver.
 */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
}

// Radix Select/Toast pointer handlers require Pointer Capture APIs.
if (typeof Element !== 'undefined') {
  const proto = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  if (typeof proto.hasPointerCapture !== 'function') {
    proto.hasPointerCapture = () => false;
  }
  if (typeof proto.setPointerCapture !== 'function') {
    proto.setPointerCapture = () => {};
  }
  if (typeof proto.releasePointerCapture !== 'function') {
    proto.releasePointerCapture = () => {};
  }
}

/**
 * matchMedia stub with controllable prefers-reduced-motion.
 * Call `setPrefersReducedMotion(true)` in tests that need the reduced query.
 */
type MatchMediaListener = (event: MediaQueryListEvent) => void;

const reducedMotionListeners = new Set<MatchMediaListener>();
let prefersReducedMotion = false;

export function setPrefersReducedMotion(value: boolean): void {
  prefersReducedMotion = value;
  const event = {
    matches: value,
    media: '(prefers-reduced-motion: reduce)',
  } as MediaQueryListEvent;
  for (const listener of reducedMotionListeners) {
    listener(event);
  }
}

function createMatchMedia(query: string): MediaQueryList {
  const isReduced =
    query.includes('prefers-reduced-motion') && query.includes('reduce');
  const listeners = isReduced ? reducedMotionListeners : new Set<MatchMediaListener>();

  return {
    get matches() {
      return isReduced ? prefersReducedMotion : false;
    },
    media: query,
    onchange: null,
    addListener(listener: MatchMediaListener) {
      listeners.add(listener);
    },
    removeListener(listener: MatchMediaListener) {
      listeners.delete(listener);
    },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      if (type === 'change' && typeof listener === 'function') {
        listeners.add(listener as MatchMediaListener);
      }
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      if (type === 'change' && typeof listener === 'function') {
        listeners.delete(listener as MatchMediaListener);
      }
    },
    dispatchEvent() {
      return false;
    },
  } as MediaQueryList;
}

globalThis.matchMedia = createMatchMedia as typeof matchMedia;

afterEach(() => {
  setPrefersReducedMotion(false);
  cleanup();
});
