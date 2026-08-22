import {
  buttonRecipe,
  checkboxRecipe,
  inputRecipe,
  radioGroupRecipe,
  switchRecipe,
  textareaRecipe,
  type ButtonVariantProps,
  type CheckboxVariantProps,
  type DensityName,
  type InputVariantProps,
  type RadioGroupVariantProps,
  type SpaceStep,
  type SwitchVariantProps,
  type TextareaVariantProps,
  type Theme,
  type ToneName,
} from '@reactive/silk-core';
import {
  controlLineHeightFactor,
  controlMinHeightStep,
  controlSizePadding,
  resolveSpaceSum,
  switchThumbInset,
  switchThumbTravel,
  switchTrackWidthStep,
  toggleBoxStep,
} from '../controlGeometry.js';
import {
  mapShadow,
  spaceScale,
  typographyStyle,
  type RnTextStyle,
  type RnViewStyle,
} from './shared.js';

const sizeFontRole = {
  sm: 'label',
  md: 'label',
  lg: 'body',
} as const satisfies Record<
  NonNullable<ButtonVariantProps['size']>,
  'label' | 'body'
>;

function buttonColors(
  theme: Theme,
  variant: NonNullable<ButtonVariantProps['variant']>,
  toneName: ToneName,
  pressed: boolean,
  disabled: boolean,
): { backgroundColor: string; color: string; borderColor: string } {
  const tone = theme.semantic.color.tones[toneName];

  if (disabled) {
    return {
      backgroundColor: tone.disabledBg,
      color: tone.disabledFg,
      borderColor: 'transparent',
    };
  }
  if (variant === 'solid') {
    return {
      backgroundColor: pressed ? tone.active : tone.solid,
      color: tone.onSolid,
      borderColor: 'transparent',
    };
  }
  if (variant === 'soft') {
    return {
      backgroundColor: pressed ? tone.subtleActive : tone.subtle,
      color: tone.text,
      borderColor: 'transparent',
    };
  }
  return {
    backgroundColor: pressed ? tone.subtleActive : 'transparent',
    color: tone.text,
    borderColor: variant === 'outline' ? tone.border : 'transparent',
  };
}

export function mapButtonStyle(
  theme: Theme,
  props: ButtonVariantProps = {},
  pressed = false,
  disabled = false,
): { view: RnViewStyle; text: RnTextStyle } {
  const variant = props.variant ?? buttonRecipe.defaults.variant;
  const toneName = props.tone ?? buttonRecipe.defaults.tone;
  const size = props.size ?? buttonRecipe.defaults.size;
  const density = props.density ?? buttonRecipe.defaults.density;
  const space = spaceScale(theme, density);
  const pad = controlSizePadding[size];
  const fontRole = sizeFontRole[size];
  const typo = theme.semantic.typography[fontRole];
  const colors = buttonColors(theme, variant, toneName, pressed, disabled);

  return {
    view: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1],
      paddingTop: space[pad.py],
      paddingBottom: space[pad.py],
      paddingLeft: space[pad.px],
      paddingRight: space[pad.px],
      borderRadius: theme.semantic.radius.md,
      // Every variant keeps a 1px border so ghost/outline match solid sizing (web parity).
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderStyle: 'solid',
      backgroundColor: colors.backgroundColor,
    },
    text: {
      color: colors.color,
      ...typographyStyle(theme, 'label'),
      fontSize: typo.size,
      lineHeight: controlLineHeightFactor * typo.size,
    },
  };
}

export type TextControlState = {
  readonly focused?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
};

export function mapInputStyle(
  theme: Theme,
  props: InputVariantProps = {},
  density: DensityName = 'comfortable',
  state: TextControlState = {},
): RnTextStyle & RnViewStyle {
  const size = props.size ?? inputRecipe.defaults.size;
  const resolvedDensity = props.density ?? density;
  const space = spaceScale(theme, resolvedDensity);
  const pad = controlSizePadding[size];
  const minHeight = resolveSpaceSum(space, controlMinHeightStep[size]);

  let borderColor = theme.semantic.color.borderSubtle;
  let backgroundColor = theme.semantic.color.surfaceSunken;
  let color = theme.semantic.color.textPrimary;

  if (state.disabled) {
    const tone = theme.semantic.color.tones.neutral;
    backgroundColor = tone.disabledBg;
    color = tone.disabledFg;
    borderColor = 'transparent';
  } else if (state.invalid) {
    borderColor = theme.semantic.color.tones.danger.solid;
  } else if (state.focused) {
    borderColor = theme.semantic.color.tones.accent.border;
  }

  return {
    minHeight,
    paddingTop: space[pad.py],
    paddingBottom: space[pad.py],
    paddingLeft: space[pad.px],
    paddingRight: space[pad.px],
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor,
    borderRadius: theme.semantic.radius.md,
    backgroundColor,
    color,
    ...typographyStyle(theme, size === 'sm' ? 'bodySm' : 'body'),
  };
}

export function mapTextareaStyle(
  theme: Theme,
  props: TextareaVariantProps = {},
  density: DensityName = 'comfortable',
  state: TextControlState = {},
): RnTextStyle & RnViewStyle {
  const size = props.size ?? textareaRecipe.defaults.size;
  const resolvedDensity = props.density ?? density;
  const space = spaceScale(theme, resolvedDensity);
  const base = mapInputStyle(
    theme,
    {
      size,
      ...(props.density !== undefined ? { density: props.density } : {}),
    },
    resolvedDensity,
    state,
  );
  return {
    ...base,
    // Web: min-height: space-8 × 2
    minHeight: space[8] * 2,
  };
}

export type ToggleVisualState = {
  readonly checked?: boolean | 'indeterminate';
  readonly invalid?: boolean;
  readonly disabled?: boolean;
};

/** Shared label row for Checkbox / RadioGroup.Item (control + optional children). */
function toggleLabelRow(
  space: Readonly<Record<SpaceStep, number>>,
): RnViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  };
}

export function mapCheckboxStyle(
  theme: Theme,
  props: CheckboxVariantProps = {},
  density: DensityName = 'comfortable',
  state: ToggleVisualState = {},
): { row: RnViewStyle; box: RnViewStyle } {
  const size = props.size ?? checkboxRecipe.defaults.size;
  const toneName = props.tone ?? checkboxRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const edge = space[toggleBoxStep[size]];
  const tone = theme.semantic.color.tones[toneName];
  const checked = state.checked === true || state.checked === 'indeterminate';

  let backgroundColor = theme.semantic.color.surfaceSunken;
  let borderColor = tone.border;
  if (state.disabled) {
    backgroundColor = tone.disabledBg;
    borderColor = 'transparent';
  } else if (checked) {
    backgroundColor = tone.solid;
    borderColor = tone.solid;
  }
  if (state.invalid && !state.disabled) {
    borderColor = theme.semantic.color.tones.danger.solid;
  }

  return {
    row: toggleLabelRow(space),
    box: {
      width: edge,
      height: edge,
      borderRadius: theme.semantic.radius.sm,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  };
}

export function mapSwitchStyle(
  theme: Theme,
  props: SwitchVariantProps = {},
  density: DensityName = 'comfortable',
  state: {
    readonly checked?: boolean;
    readonly invalid?: boolean;
    readonly disabled?: boolean;
  } = {},
): { track: RnViewStyle; thumb: RnViewStyle; travel: number } {
  const size = props.size ?? switchRecipe.defaults.size;
  const toneName = props.tone ?? switchRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const trackHeight = space[toggleBoxStep[size]];
  const trackWidth = resolveSpaceSum(space, switchTrackWidthStep[size]);
  const tone = theme.semantic.color.tones[toneName];
  const thumbSize = trackHeight - switchThumbInset * 2;
  const travel = switchThumbTravel(trackWidth, thumbSize);

  let trackBg = theme.semantic.color.borderSubtle;
  if (state.disabled) {
    trackBg = tone.disabledBg;
  } else if (state.checked) {
    trackBg = tone.solid;
  }

  return {
    track: {
      width: trackWidth,
      height: trackHeight,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: trackBg,
      outlineWidth: state.invalid && !state.disabled ? 1 : 0,
      outlineStyle: 'solid',
      outlineColor:
        state.invalid && !state.disabled
          ? theme.semantic.color.tones.danger.solid
          : 'transparent',
      justifyContent: 'center',
      flexShrink: 0,
    },
    thumb: {
      width: thumbSize,
      height: thumbSize,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: theme.semantic.color.surface,
      ...mapShadow(theme, 'raised'),
    },
    travel,
  };
}

export function mapRadioGroupStyle(
  theme: Theme,
  props: RadioGroupVariantProps = {},
  density: DensityName = 'comfortable',
): { root: RnViewStyle; item: RnViewStyle; indicator: RnViewStyle } {
  const orientation =
    props.orientation ?? radioGroupRecipe.defaults.orientation;
  const space = spaceScale(theme, density);
  const { item, indicator } = mapRadioItemStyle(theme, props, density);

  return {
    root: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
      gap: space[2],
    },
    item,
    indicator,
  };
}

export function mapRadioItemStyle(
  theme: Theme,
  props: RadioGroupVariantProps = {},
  density: DensityName = 'comfortable',
  state: ToggleVisualState = {},
): { row: RnViewStyle; item: RnViewStyle; indicator: RnViewStyle } {
  const size = props.size ?? radioGroupRecipe.defaults.size;
  const toneName = props.tone ?? radioGroupRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const edge = space[toggleBoxStep[size]];
  const tone = theme.semantic.color.tones[toneName];
  let borderColor = tone.border;
  let backgroundColor = theme.semantic.color.surfaceSunken;
  if (state.disabled) {
    backgroundColor = tone.disabledBg;
    borderColor = 'transparent';
  } else if (state.checked === true) {
    borderColor = tone.solid;
  }
  if (state.invalid && !state.disabled) {
    borderColor = theme.semantic.color.tones.danger.solid;
  }
  return {
    row: toggleLabelRow(space),
    item: {
      width: edge,
      height: edge,
      borderRadius: theme.semantic.radius.full,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    indicator: {
      width: edge * 0.5,
      height: edge * 0.5,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: tone.solid,
    },
  };
}

/** Indicator color for checked/indeterminate checkbox glyphs. */
export function checkboxIndicatorColor(
  theme: Theme,
  toneName: ToneName,
  disabled: boolean,
): string {
  const tone = theme.semantic.color.tones[toneName];
  return disabled ? tone.disabledFg : tone.onSolid;
}
