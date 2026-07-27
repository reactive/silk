import { avatarRecipe, type AvatarVariantProps } from '@reactive/silk-core';
import { useEffect, useState, type JSX, type ReactNode, type Ref } from 'react';
import {
  Image,
  Text as RNText,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapAvatarStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface AvatarProps
  extends AvatarVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly src?: string | ImageSourcePropType;
  readonly alt?: string;
  readonly fallback?: ReactNode;
}

export function Avatar({
  size,
  shape,
  src,
  alt = '',
  fallback,
  children,
  style,
  ref,
  ...rest
}: AvatarProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Avatar');
  const resolved: AvatarVariantProps = {
    size: size ?? defaults.size ?? avatarRecipe.defaults.size,
    shape: shape ?? defaults.shape ?? avatarRecipe.defaults.shape,
  };
  const mapped = mapAvatarStyle(theme, resolved);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const source =
    typeof src === 'string' ? { uri: src } : src;
  const showImage = source !== undefined && !failed;

  let content: ReactNode;
  if (children !== undefined) {
    content = children;
  } else if (showImage) {
    content = (
      <Image
        source={source}
        accessibilityLabel={alt}
        resizeMode="cover"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%' }}
      />
    );
  } else {
    content =
      fallback !== undefined ? (
        typeof fallback === 'string' || typeof fallback === 'number' ? (
          <RNText style={mapped.text}>{fallback}</RNText>
        ) : (
          fallback
        )
      ) : null;
  }

  return (
    <View ref={ref} {...rest} style={[mapped.view, style]}>
      {content}
    </View>
  );
}
