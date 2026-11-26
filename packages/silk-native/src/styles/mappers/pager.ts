import type { Theme } from '@reactive/silk-core';
import type { RnViewStyle } from './shared.js';

/** A pager indicator's look: its row, each dot's size and the pill a shown page's dot widens to. */
export interface PagerIndicatorStyle {
  readonly row: RnViewStyle;
  /** A dot's height and least width. */
  readonly dot: number;
  /** The shown page's dot's width. */
  readonly pill: number;
  readonly radius: number;
  /** A page's dot, a disabled page's, and the shown page's. */
  readonly idle: string;
  readonly disabled: string;
  readonly shown: string;
}

/**
 * Not by density, as its dots are no target to press: compact space would
 * cost the pager the whole compact scale.
 */
export function mapPagerIndicatorStyle(theme: Theme): PagerIndicatorStyle {
  const { color, space } = theme.semantic;
  return {
    row: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: space[2],
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: space[2],
    },
    dot: space[2],
    pill: space[6],
    radius: theme.semantic.radius.full,
    idle: color.textSecondary,
    disabled: color.borderSubtle,
    shown: color.textPrimary,
  };
}
