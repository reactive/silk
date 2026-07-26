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

afterEach(() => {
  cleanup();
});
