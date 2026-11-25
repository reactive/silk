/**
 * `MotionList` and `MotionView` from each platform's engine, chosen by the
 * package's `#motion-list` import: `MotionList.layout.tsx` on native,
 * `MotionList.dom.tsx` on the web.
 */
import type * as dom from './MotionList.dom.js';
import type * as layout from './MotionList.layout.js';
import type { MotionEngine } from './types.js';

export { MotionList, MotionView } from '#motion-list';

// TypeScript resolves `#motion-list` to one engine; this holds both to the same
// contract, so the two can't drift apart unseen.
type Satisfies<T extends MotionEngine> = T;
export type MotionEngines = [Satisfies<typeof layout>, Satisfies<typeof dom>];
