/**
 * MediaObject composite — synced from packages/silk/src/components/MediaObject.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import {
  mediaObjectRecipe,
  mediaScale,
  type MediaObjectVariantProps,
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
import { useComponentDefaults } from '@reactive/silk';
import { Inline } from '@reactive/silk';
import { Stack } from '@reactive/silk';

/** Presence-only — compound parts consume layout from the Root, not context. */
const MediaObjectContext = createContext(false);

function useMediaObjectContext(): void {
  if (!useContext(MediaObjectContext)) {
    throw new Error(
      'MediaObject compound parts must be used within MediaObject.Root',
    );
  }
}

export interface MediaObjectRootProps
  extends ComponentPropsWithoutRef<'div'>, MediaObjectVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

function MediaObjectRoot({
  align,
  gap,
  mediaPosition,
  size,
  asChild = false,
  className,
  children,
  ...props
}: MediaObjectRootProps): JSX.Element {
  const defaults = useComponentDefaults('MediaObject');
  const resolvedAlign =
    align ?? defaults.align ?? mediaObjectRecipe.defaults.align;
  const resolvedSize = size ?? defaults.size ?? mediaObjectRecipe.defaults.size;
  // `size` supplies the gap so the distance follows the media it separates;
  // an explicit `gap` is the opt-out.
  const resolvedGap = gap ?? defaults.gap ?? mediaScale[resolvedSize].gap;
  const resolvedMediaPosition =
    mediaPosition ??
    defaults.mediaPosition ??
    mediaObjectRecipe.defaults.mediaPosition;

  return (
    <MediaObjectContext.Provider value={true}>
      <Inline
        {...props}
        asChild={asChild}
        align={resolvedAlign}
        gap={resolvedGap}
        wrap="nowrap"
        direction={resolvedMediaPosition === 'end' ? 'row-reverse' : 'row'}
        className={className}
        data-media-position={resolvedMediaPosition}
        data-size={resolvedSize}
      >
        {children}
      </Inline>
    </MediaObjectContext.Provider>
  );
}

export type MediaObjectMediaProps = ComponentPropsWithoutRef<'div'> & {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
};

function MediaObjectMedia({
  asChild = false,
  children,
  ...props
}: MediaObjectMediaProps): JSX.Element {
  useMediaObjectContext();
  const Comp = asChild ? Slot.Root : 'div';
  return <Comp {...props}>{children}</Comp>;
}

export type MediaObjectContentProps = ComponentPropsWithoutRef<'div'> & {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
};

function MediaObjectContent({
  asChild = false,
  children,
  ...props
}: MediaObjectContentProps): JSX.Element {
  useMediaObjectContext();
  return (
    <Stack asChild={asChild} gap="1" align="start" {...props}>
      {children}
    </Stack>
  );
}

export interface MediaObjectProps
  extends Omit<MediaObjectRootProps, 'children'>, MediaObjectVariantProps {
  readonly media: ReactNode;
  readonly children: ReactNode;
}

function MediaObjectConvenience({
  media,
  children,
  ...props
}: MediaObjectProps): JSX.Element {
  return (
    <MediaObjectRoot {...props}>
      <MediaObjectMedia>{media}</MediaObjectMedia>
      <MediaObjectContent>{children}</MediaObjectContent>
    </MediaObjectRoot>
  );
}

export interface MediaObjectComponent {
  (props: MediaObjectProps): JSX.Element;
  Root: typeof MediaObjectRoot;
  Media: typeof MediaObjectMedia;
  Content: typeof MediaObjectContent;
}

export const MediaObject: MediaObjectComponent = Object.assign(
  MediaObjectConvenience,
  {
    Root: MediaObjectRoot,
    Media: MediaObjectMedia,
    Content: MediaObjectContent,
  },
);
