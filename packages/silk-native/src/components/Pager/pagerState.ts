import { type Context, createContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** A page as React renders it: its value, and whether a swipe can land on it. */
export interface RenderedPage {
  readonly key: string;
  readonly enabled: boolean;
}

/**
 * What `Pager.Root` tells the parts beside its pages (`Pager.Indicator`):
 * its pages as React renders them (`renderedPages`), and where they stand as
 * the UI thread has them (`position` of `pageKeys`, written in one step, so a
 * page's place there and the pages' position never disagree). The two lists
 * differ from a render that adds, removes or reorders pages until the UI
 * thread takes the new list, as the row of pages does: in that frame a page
 * only React has stands nowhere, and one only the UI thread has (a page just
 * removed) can hold the share its dot no longer shows.
 */
export interface PagerStateValue {
  readonly position: SharedValue<number>;
  readonly pageKeys: SharedValue<readonly string[]>;
  readonly renderedPages: readonly RenderedPage[];
}

export const PagerState: Context<PagerStateValue | null> = createContext<PagerStateValue | null>(
  null,
);
