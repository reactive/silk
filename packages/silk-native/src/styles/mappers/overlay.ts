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
 * risen from the bottom edge as a sheet (flush with it, top corners rounded,
 * its shadow cast upward). A sheet has no grab handle: it doesn't drag.
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
  const { color, radius, shadow } = theme.semantic;
  return {
    veil: {
      flex: 1,
      backgroundColor: color.overlay,
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
        ? {
            borderBottomWidth: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            // More room at the bottom edge, which on a phone sits by the
            // rounded corners and gesture bar.
            paddingBottom: space[6],
            // Lit from above like every surface, a sheet casts upward, over the page.
            shadowOffset: { width: shadow.overlay.offsetX, height: -shadow.overlay.offsetY },
          }
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

/** A view drawn as a glyph: the two borders and the turn that make a check. */
export type RnGlyphStyle = RnViewStyle & {
  borderLeftWidth?: number | undefined;
  transform?: Array<{ rotate: string } | { translateY: number }> | undefined;
};

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
 * indicator slot, lit while highlighted or pressed (web: `menuItemClass`).
 * The chosen item draws an accent check in the slot and sets its label at the
 * label role's weight; `description` colors secondary text in the row
 * (`Listbox.ItemText tone="secondary"`), dimmed with the label when disabled.
 */
export function mapListboxItemStyle(
  theme: Theme,
  props: SelectVariantProps = {},
  state: ListboxItemState,
): {
  readonly row: RnViewStyle;
  readonly indicator: RnViewStyle;
  readonly check: RnGlyphStyle;
  readonly label: RnTextStyle;
  readonly description: RnTextStyle;
} {
  const size = props.size ?? selectRecipe.defaults.size;
  const density = props.density ?? selectRecipe.defaults.density;
  const space = spaceScale(theme, density);
  const { color, radius, typography } = theme.semantic;
  const accent = color.tones.accent;
  const disabledFg = color.tones.neutral.disabledFg;
  // The slot and its check are shapes, not whitespace: they hold at every density.
  const slot = theme.semantic.space[4];
  const stroke = Math.max(2, Math.round(slot * 0.12));
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
      // The interaction ramp's hover step: `subtle` all but vanishes on a raised surface.
      backgroundColor:
        (state.highlighted || state.pressed) && !state.disabled ? accent.subtleHover : undefined,
    },
    indicator: {
      width: slot,
      height: slot,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    // Checkbox's check, drawn rather than a font's ✓, so its weight and size hold on every platform.
    check: {
      width: slot * 0.55,
      height: slot * 0.35,
      borderLeftWidth: stroke,
      borderBottomWidth: stroke,
      borderColor: state.disabled ? disabledFg : accent.solid,
      transform: [{ rotate: '-45deg' }, { translateY: -slot * 0.05 }],
    },
    label: {
      color: state.disabled
        ? disabledFg
        : state.highlighted || state.selected
          ? accent.text
          : color.textPrimary,
      ...(state.selected
        ? { fontWeight: String(typography.label.weight) as NonNullable<RnTextStyle['fontWeight']> }
        : {}),
    },
    description: {
      color: state.disabled ? disabledFg : color.textSecondary,
    },
  };
}
