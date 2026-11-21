import {
  dialogRecipe,
  popoverRecipe,
  selectRecipe,
  type DensityName,
  type DialogVariantProps,
  type PopoverVariantProps,
  type SelectVariantProps,
  type Theme,
} from '@reactive/silk-core';
import { listboxRowMinHeightStep, resolveSpaceSum } from '../controlGeometry.js';
import { elevationBackground } from './visual.js';
import { mapShadow, type RnTextStyle, type RnViewStyle, spaceScale } from './shared.js';

/** The floating-surface treatment every overlay shares (web: `floatingSurfaceClass`). */
function floatingSurface(theme: Theme): RnViewStyle {
  const { color, radius } = theme.semantic;
  return {
    backgroundColor: elevationBackground(theme, 'overlay'),
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: color.borderSubtle,
    borderRadius: radius.md,
    ...mapShadow(theme, 'overlay'),
  };
}

/** Widest a dialog grows at each size (web parity); `full` spans the screen. */
const DIALOG_WIDTH = { sm: 360, md: 480, lg: 640 } as const;
/** Widest a popover grows at each size (web parity). */
const POPOVER_WIDTH = { sm: 220, md: 320, lg: 420 } as const;

/**
 * Dialog: the veil filling the screen behind it, and its panel, centered or
 * risen from the bottom edge as a sheet (flush with it, top corners rounded).
 */
export function mapDialogStyle(
  theme: Theme,
  props: DialogVariantProps = {},
  density: DensityName = 'comfortable',
): { readonly veil: RnViewStyle; readonly panel: RnViewStyle } {
  const size = props.size ?? dialogRecipe.defaults.size;
  const placement = props.placement ?? dialogRecipe.defaults.placement;
  const space = spaceScale(theme, density);
  const bottom = placement === 'bottom';
  const { radius } = theme.semantic;
  return {
    veil: {
      flex: 1,
      backgroundColor: theme.semantic.color.overlay,
      alignItems: 'center',
      justifyContent: bottom ? 'flex-end' : 'center',
      // A gutter around a centered panel; a sheet meets the screen's edges.
      padding: bottom ? 0 : space[3],
    },
    panel: {
      ...floatingSurface(theme),
      borderRadius: radius.lg,
      padding: space[5],
      width: '100%',
      maxWidth: size === 'full' ? undefined : DIALOG_WIDTH[size],
      maxHeight: bottom ? '88%' : '100%',
      overflow: 'hidden',
      ...(bottom
        ? { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
        : {}),
    },
  };
}

/** Popover: the floating surface, at its size's width and no wider than the window allows. */
export function mapPopoverStyle(
  theme: Theme,
  props: PopoverVariantProps = {},
): RnViewStyle {
  const size = props.size ?? popoverRecipe.defaults.size;
  return {
    ...floatingSurface(theme),
    padding: theme.semantic.space[2],
    width: POPOVER_WIDTH[size],
    // No wider than the layer, which narrows to fit the window.
    maxWidth: '100%',
    // Shrinks to the room the layer gives it, so a list inside scrolls.
    flexShrink: 1,
  };
}

/** What a listbox item shows about itself. */
export interface ListboxItemState {
  /** Pointed at, or focused last: the one the keys act on. */
  readonly highlighted: boolean;
  /** Held down by a finger or pointer: lit like a highlighted item, so a tap shows. */
  readonly pressed: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

/**
 * Listbox item (Select's vocabulary: `size`, `density`): a row with an
 * indicator slot, lit while highlighted (web: `menuItemClass`).
 */
export function mapListboxItemStyle(
  theme: Theme,
  props: SelectVariantProps = {},
  state: ListboxItemState,
): {
  readonly row: RnViewStyle;
  readonly indicator: RnViewStyle;
  readonly label: RnTextStyle;
} {
  const size = props.size ?? selectRecipe.defaults.size;
  const density = props.density ?? selectRecipe.defaults.density;
  const space = spaceScale(theme, density);
  const { color, radius } = theme.semantic;
  const accent = color.tones.accent;
  return {
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[2],
      minHeight: resolveSpaceSum(space, listboxRowMinHeightStep[size]),
      paddingLeft: space[2],
      paddingRight: space[2],
      paddingTop: space[1],
      paddingBottom: space[1],
      borderRadius: radius.sm,
      backgroundColor:
        (state.highlighted || state.pressed) && !state.disabled ? accent.subtle : undefined,
    },
    indicator: {
      width: theme.semantic.space[4],
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    label: {
      color: state.disabled
        ? color.tones.neutral.disabledFg
        : state.highlighted || state.selected
          ? accent.text
          : color.textPrimary,
    },
  };
}
