import { css, cx } from '@linaria/core';
import type { AvatarVariantProps } from '@reactive/silk-core';
import {
  createContext,
  useContext,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { Avatar, type AvatarProps } from './Avatar';
import { Stack } from './Stack';
import { Text } from './Text';

interface IdentityContextValue {
  readonly size: NonNullable<AvatarVariantProps['size']>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

function useIdentityContext(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error('Identity compound parts must be used within Identity.Root');
  }
  return ctx;
}

export interface IdentityRootProps {
  readonly size?: AvatarVariantProps['size'];
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
}

const rootClass: string = css`
  display: inline-flex;
  align-items: center;
  gap: var(--silk-space-2);
  min-width: 0;
`;

function IdentityRoot({
  size,
  className,
  style,
  children,
  ref,
}: IdentityRootProps): JSX.Element {
  const defaults = useComponentDefaults('Identity');
  const resolvedSize = size ?? defaults.size ?? 'md';

  return (
    <IdentityContext.Provider value={{ size: resolvedSize }}>
      <div
        ref={ref}
        className={cx(rootClass, className)}
        style={style}
        data-size={resolvedSize}
      >
        {children}
      </div>
    </IdentityContext.Provider>
  );
}

export type IdentityAvatarProps = Omit<AvatarProps, 'size'>;

function IdentityAvatar(props: IdentityAvatarProps): JSX.Element {
  const { size } = useIdentityContext();
  return <Avatar size={size} {...props} />;
}

export interface IdentityNameProps {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLParagraphElement>;
}

function IdentityName({
  className,
  children,
  ref,
}: IdentityNameProps): JSX.Element {
  return (
    <Text
      {...(ref !== undefined ? { ref } : {})}
      {...(className !== undefined ? { className } : {})}
      role="label"
      tone="primary"
    >
      {children}
    </Text>
  );
}

export interface IdentityMetaProps {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLParagraphElement>;
}

function IdentityMeta({
  className,
  children,
  ref,
}: IdentityMetaProps): JSX.Element {
  return (
    <Text
      {...(ref !== undefined ? { ref } : {})}
      {...(className !== undefined ? { className } : {})}
      role="caption"
      tone="secondary"
    >
      {children}
    </Text>
  );
}

export interface IdentityProps {
  readonly name: ReactNode;
  readonly meta?: ReactNode;
  readonly avatar?: string | ReactNode;
  readonly avatarAlt?: string;
  readonly fallback?: ReactNode;
  readonly size?: AvatarVariantProps['size'];
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * Convenience form — Ant-style data-in API over compound parts.
 */
function IdentityConvenience({
  name,
  meta,
  avatar,
  avatarAlt,
  fallback,
  size,
  className,
  style,
  ref,
}: IdentityProps): JSX.Element {
  let avatarNode: JSX.Element;
  if (typeof avatar === 'string') {
    avatarNode = (
      <IdentityAvatar
        src={avatar}
        {...(avatarAlt !== undefined ? { alt: avatarAlt } : {})}
        {...(fallback !== undefined ? { fallback } : {})}
      />
    );
  } else if (avatar === undefined) {
    avatarNode = (
      <IdentityAvatar
        {...(fallback !== undefined ? { fallback } : {})}
      />
    );
  } else {
    avatarNode = <IdentityAvatar>{avatar}</IdentityAvatar>;
  }

  return (
    <IdentityRoot
      {...(size !== undefined ? { size } : {})}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
      {...(ref !== undefined ? { ref } : {})}
    >
      {avatarNode}
      <Stack gap="0" align="start">
        <IdentityName>{name}</IdentityName>
        {meta !== undefined && meta !== null ? (
          <IdentityMeta>{meta}</IdentityMeta>
        ) : null}
      </Stack>
    </IdentityRoot>
  );
}

export interface IdentityComponent {
  (props: IdentityProps): JSX.Element;
  Root: typeof IdentityRoot;
  Avatar: typeof IdentityAvatar;
  Name: typeof IdentityName;
  Meta: typeof IdentityMeta;
}

export const Identity: IdentityComponent = Object.assign(IdentityConvenience, {
  Root: IdentityRoot,
  Avatar: IdentityAvatar,
  Name: IdentityName,
  Meta: IdentityMeta,
});
