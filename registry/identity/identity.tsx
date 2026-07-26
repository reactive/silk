/**
 * Identity composite — synced from packages/silk/src/components/Identity.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import type { AvatarVariantProps, IdentityModel } from '@reactive/silk-core';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { useComponentDefaults } from '@reactive/silk';
import { Avatar, type AvatarProps } from '@reactive/silk';
import { Inline } from '@reactive/silk';
import { Stack } from '@reactive/silk';
import { Text, type TextProps } from '@reactive/silk';

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

export interface IdentityRootProps extends ComponentPropsWithoutRef<'div'> {
  readonly size?: AvatarVariantProps['size'];
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

function IdentityRoot({
  size,
  asChild = false,
  className,
  children,
  ...props
}: IdentityRootProps): JSX.Element {
  const defaults = useComponentDefaults('Identity');
  const resolvedSize = size ?? defaults.size ?? 'md';

  return (
    <IdentityContext.Provider value={{ size: resolvedSize }}>
      <Inline
        {...props}
        asChild={asChild}
        gap="2"
        align="center"
        wrap="nowrap"
        className={className}
        data-size={resolvedSize}
      >
        {children}
      </Inline>
    </IdentityContext.Provider>
  );
}

export type IdentityAvatarProps = Omit<AvatarProps, 'size'>;

function IdentityAvatar(props: IdentityAvatarProps): JSX.Element {
  const { size } = useIdentityContext();
  return <Avatar size={size} {...props} />;
}

export type IdentityNameProps = Omit<TextProps, 'role' | 'tone'>;

function IdentityName(props: IdentityNameProps): JSX.Element {
  useIdentityContext();
  return <Text {...props} role="label" tone="primary" />;
}

export type IdentityMetaProps = Omit<TextProps, 'role' | 'tone'>;

function IdentityMeta(props: IdentityMetaProps): JSX.Element {
  useIdentityContext();
  return <Text {...props} role="caption" tone="secondary" />;
}

interface IdentityConvenienceBase
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  readonly avatar?: string | ReactNode;
  readonly avatarAlt?: string;
  readonly fallback?: ReactNode;
  readonly meta?: ReactNode | null;
  readonly size?: AvatarVariantProps['size'];
  readonly ref?: Ref<HTMLDivElement>;
}

export type IdentityProps = IdentityConvenienceBase &
  (
    | {
        readonly model: IdentityModel;
        readonly name?: ReactNode;
      }
    | {
        readonly model?: never;
        readonly name: ReactNode;
      }
  );

/**
 * Convenience form — thin sugar over compound parts.
 * Precedence: explicit props → model → provider defaults → primitive defaults.
 */
function IdentityConvenience({
  model,
  name,
  meta,
  avatar,
  avatarAlt,
  fallback,
  size,
  className,
  ...props
}: IdentityProps): JSX.Element {
  const resolvedName = name !== undefined ? name : model!.name;
  const resolvedMeta = meta !== undefined ? meta : (model?.meta ?? undefined);
  const resolvedFallback =
    fallback !== undefined ? fallback : (model?.fallback ?? undefined);
  const resolvedAvatar =
    avatar !== undefined
      ? avatar
      : model?.avatar !== undefined
        ? model.avatar.src
        : undefined;
  const resolvedAvatarAlt =
    avatarAlt !== undefined ? avatarAlt : (model?.avatar?.alt ?? undefined);

  let avatarNode: JSX.Element;
  if (typeof resolvedAvatar === 'string') {
    avatarNode = (
      <IdentityAvatar
        src={resolvedAvatar}
        {...(resolvedAvatarAlt !== undefined
          ? { alt: resolvedAvatarAlt }
          : {})}
        {...(resolvedFallback !== undefined
          ? { fallback: resolvedFallback }
          : {})}
      />
    );
  } else if (resolvedAvatar === undefined) {
    avatarNode = (
      <IdentityAvatar
        {...(resolvedFallback !== undefined
          ? { fallback: resolvedFallback }
          : {})}
      />
    );
  } else {
    avatarNode = <IdentityAvatar>{resolvedAvatar}</IdentityAvatar>;
  }

  return (
    <IdentityRoot
      {...props}
      {...(size !== undefined ? { size } : {})}
      {...(className !== undefined ? { className } : {})}
    >
      {avatarNode}
      <Stack gap="0" align="start">
        <IdentityName>{resolvedName}</IdentityName>
        {resolvedMeta !== undefined && resolvedMeta !== null ? (
          <IdentityMeta>{resolvedMeta}</IdentityMeta>
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
