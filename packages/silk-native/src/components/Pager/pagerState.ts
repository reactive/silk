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
 * page's place there and the pages' position never disagree). After a
 * render that adds, removes or reorders pages, the two lists differ for a
 * frame, until the UI thread takes the new one, as the row of pages does. In
 * that frame a page only React has stands nowhere, and a page just removed
 * still holds its share of the pill on the UI thread with no dot to show it,
 * so a removed shown page leaves no pill for that frame.
 */
export interface PagerStateValue {
  readonly position: SharedValue<number>;
  readonly pageKeys: SharedValue<readonly string[]>;
  readonly renderedPages: readonly RenderedPage[];
}

export const PagerState: Context<PagerStateValue | null> = createContext<PagerStateValue | null>(
  null,
);
