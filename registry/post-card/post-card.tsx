/**
 * PostCard composite — synced from packages/silk/src/components/PostCard.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import {
  postCardRecipe,
  type PostCardVariantProps,
  type PostModel,
  type StatModel,
} from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { densityClass } from '@reactive/silk';
import { useComponentDefaults } from '@reactive/silk';
import { ActionBar } from '@reactive/silk';
import { Card } from '@reactive/silk';
import { formatTimestamp } from './formatTimestamp';
import { Identity } from '@reactive/silk';
import { Inline } from '@reactive/silk';
import { Stack } from '@reactive/silk';
import { Surface } from '@reactive/silk';
import { Text } from '@reactive/silk';

interface PostCardContextValue {
  readonly density: NonNullable<PostCardVariantProps['density']>;
}

const PostCardContext = createContext<PostCardContextValue | null>(null);

function usePostCardContext(): PostCardContextValue {
  const ctx = useContext(PostCardContext);
  if (!ctx) {
    throw new Error('PostCard compound parts must be used within PostCard.Root');
  }
  return ctx;
}

export interface PostCardRootProps
  extends ComponentPropsWithoutRef<'article'>, PostCardVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
}

function PostCardRoot({
  density,
  asChild = false,
  className,
  children,
  ...props
}: PostCardRootProps): JSX.Element {
  const defaults = useComponentDefaults('PostCard');
  const resolvedDensity =
    density ?? defaults.density ?? postCardRecipe.defaults.density;

  const Comp = asChild ? Slot.Root : 'article';
  return (
    <PostCardContext.Provider value={{ density: resolvedDensity }}>
      <Card
        asChild
        elevation="raised"
        radius="lg"
        className={className}
        data-density={resolvedDensity}
      >
        <Comp {...props} className={densityClass} data-density={resolvedDensity}>
          {/* Stack must live inside the consumer element when asChild; Slottable
              re-parents children. See ARCHITECTURE.md#aschild-with-decorations */}
          <Slot.Slottable child={children}>
            {(slotted) => <Stack gap="3">{slotted}</Stack>}
          </Slot.Slottable>
        </Comp>
      </Card>
    </PostCardContext.Provider>
  );
}

export type PostCardHeaderProps = ComponentPropsWithoutRef<'header'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function PostCardHeader({
  children,
  ...props
}: PostCardHeaderProps): JSX.Element {
  usePostCardContext();
  return (
    <Inline asChild gap="3" align="center" justify="between" wrap="wrap">
      <header {...props}>{children}</header>
    </Inline>
  );
}

export type PostCardBodyProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function PostCardBody(props: PostCardBodyProps): JSX.Element {
  usePostCardContext();
  return <div {...props} />;
}

export type PostCardMediaProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function PostCardMedia(props: PostCardMediaProps): JSX.Element {
  usePostCardContext();
  return <div {...props} />;
}

export type PostCardFooterProps = ComponentPropsWithoutRef<'footer'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function PostCardFooter({
  children,
  ...props
}: PostCardFooterProps): JSX.Element {
  usePostCardContext();
  return (
    <Stack asChild gap="2" align="stretch">
      <footer {...props}>{children}</footer>
    </Stack>
  );
}

export interface PostCardProps
  extends Omit<PostCardRootProps, 'children'>, PostCardVariantProps {
  readonly model: PostModel;
  readonly menu?: ReactNode;
  readonly onAction?: (actionId: string) => void;
  readonly href?: string;
  readonly timestampLabel?: ReactNode;
}

function formatEngagement(stats: readonly StatModel[]): string {
  return stats
    .map((stat) => {
      const unit = stat.label.toLowerCase();
      return `${stat.value} ${unit}`;
    })
    .join(' · ');
}

function PostCardConvenience({
  model,
  menu,
  onAction,
  href,
  timestampLabel,
  ...props
}: PostCardProps): JSX.Element {
  const timeLabel = timestampLabel ?? formatTimestamp(model.createdAt);
  const timeNode =
    href !== undefined ? (
      <a href={href}>
        <time dateTime={model.createdAt}>{timeLabel}</time>
      </a>
    ) : (
      <time dateTime={model.createdAt}>{timeLabel}</time>
    );
  const meta =
    model.author.meta !== undefined ? (
      <>
        {model.author.meta}
        <span aria-hidden="true"> · </span>
        {timeNode}
      </>
    ) : (
      timeNode
    );

  return (
    <PostCardRoot {...props}>
      <PostCardHeader>
        <Identity model={model.author} meta={meta} />
        {menu}
      </PostCardHeader>
      <PostCardBody>
        <Stack gap="2" align="stretch">
          <Text role="body">{model.body}</Text>
          {model.stats !== undefined && model.stats.length > 0 ? (
            <Text role="caption" tone="secondary">
              {formatEngagement(model.stats)}
            </Text>
          ) : null}
        </Stack>
      </PostCardBody>
      {model.media !== undefined && model.media.length > 0 ? (
        <PostCardMedia>
          {model.media.map((item) => (
            <Surface key={item.id} radius="md" elevation="sunken" border="subtle">
              {item.kind === 'image' ? (
                <img src={item.src} alt={item.alt} width="100%" />
              ) : (
                <video
                  src={item.src}
                  poster={item.poster}
                  controls
                  width="100%"
                >
                  {item.alt}
                </video>
              )}
            </Surface>
          ))}
        </PostCardMedia>
      ) : null}
      {model.actions !== undefined && model.actions.length > 0 ? (
        <PostCardFooter>
          <ActionBar.Root aria-label="Post actions">
            {model.actions.map((action) => (
              <ActionBar.Descriptor
                key={action.id}
                action={action}
                variant="soft"
                {...(onAction !== undefined ? { onAction } : {})}
              />
            ))}
          </ActionBar.Root>
        </PostCardFooter>
      ) : null}
    </PostCardRoot>
  );
}

export interface PostCardComponent {
  (props: PostCardProps): JSX.Element;
  Root: typeof PostCardRoot;
  Header: typeof PostCardHeader;
  Body: typeof PostCardBody;
  Media: typeof PostCardMedia;
  Footer: typeof PostCardFooter;
}

export const PostCard: PostCardComponent = Object.assign(PostCardConvenience, {
  Root: PostCardRoot,
  Header: PostCardHeader,
  Body: PostCardBody,
  Media: PostCardMedia,
  Footer: PostCardFooter,
});
