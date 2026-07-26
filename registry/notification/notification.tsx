/**
 * Notification composite — synced from packages/silk/src/components/Notification.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import type { NotificationModel } from '@reactive/silk-core';
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { Avatar } from '@reactive/silk';
import { Box } from '@reactive/silk';
import { formatTimestamp } from './formatTimestamp';
import { Inline } from '@reactive/silk';
import { MediaObject } from '@reactive/silk';
import { Stack } from '@reactive/silk';
import { StatusDot } from '@reactive/silk';
import { Surface } from '@reactive/silk';
import { Text } from '@reactive/silk';

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
      <Surface
        asChild
        elevation={elevation}
        radius="lg"
        border="subtle"
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
      </Surface>
    );
  }

  return (
    <Surface
      asChild
      elevation={elevation}
      radius="lg"
      border="subtle"
      className={className}
    >
      <article {...props} data-read={read ? 'true' : 'false'}>
        {children}
      </article>
    </Surface>
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
      <Box padding="4">
        <MediaObject
          gap="3"
          align="start"
          media={
            <Avatar
              size="md"
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
          <Stack gap="1" align="start">
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
                <Text role="label" tone="primary">
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
          </Stack>
        </MediaObject>
      </Box>
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
