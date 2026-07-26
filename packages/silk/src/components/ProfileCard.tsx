import {
  profileCardRecipe,
  type ProfileCardVariantProps,
  type ProfileModel,
} from '@reactive/silk-core';
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { ActionDescriptorButton } from './ActionDescriptorButton';
import { Card } from './Card';
import { Identity } from './Identity';
import { Inline } from './Inline';
import { Stack } from './Stack';
import { StatGroup } from './StatGroup';
import { Text } from './Text';

export interface ProfileCardRootProps
  extends ComponentPropsWithoutRef<'article'>, ProfileCardVariantProps {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
}

function ProfileCardRoot({
  layout,
  className,
  children,
  ...props
}: ProfileCardRootProps): JSX.Element {
  const defaults = useComponentDefaults('ProfileCard');
  const resolvedLayout =
    layout ?? defaults.layout ?? profileCardRecipe.defaults.layout;

  return (
    <Card
      asChild
      elevation="raised"
      radius="lg"
      padding="5"
      className={className}
      data-layout={resolvedLayout}
    >
      <article {...props}>{children}</article>
    </Card>
  );
}

export type ProfileCardHeaderProps = ComponentPropsWithoutRef<'header'> & {
  readonly children?: ReactNode;
};

function ProfileCardHeader({
  children,
  ...props
}: ProfileCardHeaderProps): JSX.Element {
  return (
    <Inline asChild gap="3" align="center" justify="between" wrap="wrap">
      <header {...props}>{children}</header>
    </Inline>
  );
}

export type ProfileCardBodyProps = ComponentPropsWithoutRef<'div'> & {
  readonly children?: ReactNode;
};

function ProfileCardBody(props: ProfileCardBodyProps): JSX.Element {
  return <div {...props} />;
}

export type ProfileCardActionsProps = ComponentPropsWithoutRef<'div'> & {
  readonly children?: ReactNode;
};

function ProfileCardActions(props: ProfileCardActionsProps): JSX.Element {
  return <Inline gap="2" wrap="wrap" align="center" {...props} />;
}

export interface ProfileCardProps
  extends Omit<ProfileCardRootProps, 'children'>, ProfileCardVariantProps {
  readonly model: ProfileModel;
  readonly action?: ReactNode;
  readonly onAction?: (actionId: string) => void;
}

function ProfileCardConvenience({
  model,
  layout,
  action,
  onAction,
  ...props
}: ProfileCardProps): JSX.Element {
  const defaults = useComponentDefaults('ProfileCard');
  const resolvedLayout =
    layout ?? defaults.layout ?? profileCardRecipe.defaults.layout;

  const actions =
    action !== undefined ? (
      <ProfileCardActions>{action}</ProfileCardActions>
    ) : model.actions !== undefined && model.actions.length > 0 ? (
      <ProfileCardActions>
        {model.actions.map((item) => (
          <ActionDescriptorButton
            key={item.id}
            action={item}
            variant="solid"
            size="sm"
            {...(onAction !== undefined ? { onAction } : {})}
          />
        ))}
      </ProfileCardActions>
    ) : null;

  const identity = <Identity model={model.identity} size="lg" />;
  const bio =
    model.bio !== undefined ? (
      <Text role="body" tone="secondary">
        {model.bio}
      </Text>
    ) : null;
  const stats =
    model.stats !== undefined && model.stats.length > 0 ? (
      <StatGroup stats={model.stats} size="md" />
    ) : null;

  if (resolvedLayout === 'horizontal') {
    return (
      <ProfileCardRoot {...props} layout={resolvedLayout}>
        <Inline gap="5" align="start" wrap="wrap">
          <ProfileCardHeader>{identity}</ProfileCardHeader>
          <ProfileCardBody>
            <Stack gap="3" align="start">
              {bio}
              {stats}
              {actions}
            </Stack>
          </ProfileCardBody>
        </Inline>
      </ProfileCardRoot>
    );
  }

  return (
    <ProfileCardRoot {...props} layout={resolvedLayout}>
      <Stack gap="4" align="stretch">
        <ProfileCardHeader>
          {identity}
          {actions}
        </ProfileCardHeader>
        <ProfileCardBody>
          <Stack gap="3" align="start">
            {bio}
            {stats}
          </Stack>
        </ProfileCardBody>
      </Stack>
    </ProfileCardRoot>
  );
}

export interface ProfileCardComponent {
  (props: ProfileCardProps): JSX.Element;
  Root: typeof ProfileCardRoot;
  Header: typeof ProfileCardHeader;
  Body: typeof ProfileCardBody;
  Actions: typeof ProfileCardActions;
}

export const ProfileCard: ProfileCardComponent = Object.assign(
  ProfileCardConvenience,
  {
    Root: ProfileCardRoot,
    Header: ProfileCardHeader,
    Body: ProfileCardBody,
    Actions: ProfileCardActions,
  },
);
