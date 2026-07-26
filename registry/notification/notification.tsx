/**
 * Notification composite — synced from packages/silk/src/components/Notification.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import {
  mediaObjectRecipe,
  mediaScale,
  type NotificationModel,
} from '@reactive/silk-core';
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { Avatar } from '@reactive/silk';
import { Card } from '@reactive/silk';
import { formatTimestamp } from './formatTimestamp';
import { Inline } from '@reactive/silk';
import { MediaObject } from '@reactive/silk';
import { StatusDot } from '@reactive/silk';
import { Text } from '@reactive/silk';

/** Notifications sit alongside posts in a feed, so they share the post scale. */
const NOTIFICATION_SIZE = mediaObjectRecipe.defaults.size;

export interface NotificationRootProps
  extends ComponentPropsWithoutRef<'article'> {
  readonly read?: boolean;
  readonly href?: string;
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
}

function NotificationRoot({
  read = true,
  href,
  className,
  children,
  ...props
}: NotificationRootProps): JSX.Element {
  const elevation = read ? 'flat' : 'raised';
  const interactive = href !== undefined ? 'true' : 'false';

  if (href !== undefined) {
    return (
      <Card
        asChild
        elevation={elevation}
        radius="lg"
        interactive={interactive}
        className={className}
      >
        <a
          {...(props as ComponentPropsWithoutRef<'a'>)}
          href={href}
          data-read={read ? 'true' : 'false'}
        >
          {children}
        </a>
      </Card>
    );
  }

  return (
    <Card asChild elevation={elevation} radius="lg" className={className}>
      <article {...props} data-read={read ? 'true' : 'false'}>
        {children}
      </article>
    </Card>
  );
}

export interface NotificationProps
  extends Omit<NotificationRootProps, 'children' | 'read' | 'href'> {
  readonly model: NotificationModel;
  readonly timestampLabel?: ReactNode;
}

function NotificationConvenience({
  model,
  timestampLabel,
  ...props
}: NotificationProps): JSX.Element {
  const timeLabel = timestampLabel ?? formatTimestamp(model.createdAt);
  const actorFallback =
    model.actor?.fallback ?? model.kind.slice(0, 1).toUpperCase();

  return (
    <NotificationRoot
      {...props}
      read={model.read}
      {...(model.href !== undefined ? { href: model.href } : {})}
    >
      <MediaObject
        size={NOTIFICATION_SIZE}
        align="start"
        media={
          <Avatar
            size={NOTIFICATION_SIZE}
            {...(model.actor?.avatar !== undefined
              ? {
                  src: model.actor.avatar.src,
                  alt: model.actor.avatar.alt,
                }
              : {})}
            fallback={actorFallback}
          />
        }
      >
        <Inline gap="2" align="center" wrap="wrap">
          {!model.read ? (
            <StatusDot
              tone="accent"
              size="sm"
              role="img"
              aria-label="Unread"
              aria-hidden={false}
            />
          ) : null}
          {model.actor !== undefined ? (
            <Text
              role={mediaScale[NOTIFICATION_SIZE].primaryRole}
              tone="primary"
            >
              {model.actor.name}
            </Text>
          ) : null}
          <Text role="body" tone="secondary">
            {model.text}
          </Text>
        </Inline>
        <Text asChild role="caption" tone="secondary">
          <time dateTime={model.createdAt}>{timeLabel}</time>
        </Text>
      </MediaObject>
    </NotificationRoot>
  );
}

export interface NotificationComponent {
  (props: NotificationProps): JSX.Element;
  Root: typeof NotificationRoot;
}

export const Notification: NotificationComponent = Object.assign(
  NotificationConvenience,
  {
    Root: NotificationRoot,
  },
);
