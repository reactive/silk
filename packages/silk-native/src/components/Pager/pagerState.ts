import { type Context, createContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/**
 * What `Pager.Root` tells the parts beside its pages (`Pager.Indicator`):
 * its pages as React renders them (`keys`, `enabledPages`), and where they
 * stand as the UI thread has them (`position` of `pageKeys`, which change
 * together, so a page's place and the pages' position never disagree).
 */
export interface PagerStateValue {
  readonly position: SharedValue<number>;
  readonly pageKeys: SharedValue<readonly string[]>;
  readonly keys: readonly string[];
  readonly enabledPages: readonly boolean[];
}

export const PagerState: Context<PagerStateValue | null> = createContext<PagerStateValue | null>(
  null,
);
