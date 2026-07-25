export {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Identity,
  Stack,
  Text,
} from './components';
export type {
  AvatarProps,
  BoxProps,
  ButtonProps,
  DialogContentProps,
  IdentityAvatarProps,
  IdentityMetaProps,
  IdentityNameProps,
  IdentityProps,
  IdentityRootProps,
  StackProps,
  TextProps,
} from './components';

export {
  createTheme,
  SilkProvider,
  ThemeProvider,
  themeToCssVars,
} from './theme';
export type {
  ColorScheme,
  CreateThemeOptions,
  CssVarMap,
  Palette,
  SemanticTokens,
  SilkDefaults,
  SilkProviderProps,
  Theme,
  ThemeProviderProps,
} from './theme';

export {
  avatarRecipe,
  buttonRecipe,
  dialogRecipe,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
export type {
  AvatarVariantProps,
  ButtonVariantProps,
  DialogVariantProps,
  StackVariantProps,
  TextVariantProps,
} from '@reactive/silk-core';
