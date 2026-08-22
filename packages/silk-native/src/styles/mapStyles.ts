/**
 * Public mapper barrel. Implementations are split by domain so adding a native
 * component does not keep growing one cross-cutting module.
 *
 * Mapper modules intentionally avoid importing react-native: Node tests can run
 * them directly and the emitted declarations stand alone without RN types.
 */
export {
  mapBoxStyle,
  mapInlineStyle,
  mapStackStyle,
} from './mappers/layout.js';
export {
  checkboxIndicatorColor,
  mapButtonStyle,
  mapCheckboxStyle,
  mapInputStyle,
  mapRadioGroupStyle,
  mapRadioItemStyle,
  mapSwitchStyle,
  mapTextareaStyle,
} from './mappers/controls.js';
export type {
  TextControlState,
  ToggleVisualState,
} from './mappers/controls.js';
export {
  elevationBackground,
  mapAvatarStyle,
  mapBadgeStyle,
  mapCardStyle,
  mapHeadingStyle,
  mapProgressStyle,
  mapSeparatorStyle,
  mapSkeletonStyle,
  mapSpinnerStyle,
  mapStatusDotStyle,
  mapSurfaceStyle,
  mapTextStyle,
} from './mappers/visual.js';
export {
  mapShadow,
  resolveNativeFontFamily,
} from './mappers/shared.js';
export type { RnTextStyle, RnViewStyle } from './mappers/shared.js';
