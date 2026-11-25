import type { ComponentRef, ComponentType, ReactNode, Ref } from 'react';
import type { View, ViewProps } from 'react-native';

/**
 * A list whose items glide (on the theme's `motion.brisk` spring) to wherever
 * a commit that renders the list moves them. A change made by an item's own
 * state, without rendering the list, glides on native (every layout change of
 * a view animates) and jumps on the web. It renders no element of
 * its own and knows nothing of the layout, so it fits any list. On the web it
 * measures items where they are on screen, so an item glides from where it
 * was seen even when the commit scrolls the list (as hiding rows at its end
 * does); a commit that scrolls on purpose (a row scrolled into view in a
 * layout effect) glides every item by the scroll there too.
 */
export interface MotionListProps {
  /**
   * The change whose new items fade in on `motion.normal` (and, on the web,
   * whose removed items fade out on `motion.fast`): the list, or what decides it. Items mounting or unmounting on
   * any other change appear and go at once. Key the list by its subject
   * (`key={…}`), so a list rebuilt for a new one mounts afresh instead of
   * taking the change of subject for this change.
   */
  readonly layoutDependency: unknown;
  readonly children: ReactNode;
}

/** Names an item across renders: its row's id, unique in its list. */
export type MotionKey = string | number;

/**
 * A view that moves instead of jumping: inside a `MotionList`, the item
 * named `id` (the web follows it by `id` even when React remounts it
 * elsewhere; native follows the view itself). Use it like a `View`; the
 * motion owns its translate and opacity, and on the web lifts its `z-index`
 * while it crosses other items.
 */
export interface MotionViewProps extends Omit<ViewProps, 'id'> {
  readonly id: MotionKey;
  /** The host view, as on a `View`. */
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * A platform's motion engine (`MotionList.layout.tsx` on native,
 * `MotionList.dom.tsx` on the web, chosen by the package's `#motion-list`
 * import). TypeScript resolves that import to one of them, so `MotionList.ts`
 * holds both to this.
 */
export interface MotionEngine {
  readonly MotionList: ComponentType<MotionListProps>;
  readonly MotionView: ComponentType<MotionViewProps>;
}
