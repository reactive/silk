import {
  cardRecipe,
  mediaScale,
  mediaScaleSizes,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Comment } from './Comment';
import { Identity } from './Identity';
import { MediaObject } from './MediaObject';
import { Notification } from './Notification';
import { PostCard } from './PostCard';
import { ProfileCard } from './ProfileCard';
import { SettingsPanel } from './SettingsPanel';

/**
 * Pin the shared media table so composites cannot drift apart — and so a silent
 * retune of the literal px/gap values still fails somewhere.
 */
test('mediaScale pins the shared 24/40/64 ladder', () => {
  expect(mediaScaleSizes).toEqual(['sm', 'md', 'lg']);
  expect(mediaScale.sm).toEqual({
    media: 24,
    gap: '2',
    primaryRole: 'label',
    metaRole: 'caption',
  });
  expect(mediaScale.md).toEqual({
    media: 40,
    gap: '3',
    primaryRole: 'headingSm',
    metaRole: 'caption',
  });
  expect(mediaScale.lg).toEqual({
    media: 64,
    gap: '4',
    primaryRole: 'headingSm',
    metaRole: 'bodySm',
  });
});

test('Identity, MediaObject, and Notification share the md mediaScale gap', () => {
  const { unmount: unmountIdentity } = render(
    <Identity name="Ada" fallback="A" />,
  );
  // Convenience wraps name/meta in a gap="0" Stack — read the size root.
  const identityGap = screen
    .getByText('Ada')
    .closest('[data-size]')
    ?.getAttribute('data-gap');
  unmountIdentity();

  const { unmount: unmountMedia } = render(
    <MediaObject media={<span>M</span>}>Content</MediaObject>,
  );
  const mediaGap = screen
    .getByText('Content')
    .closest('[data-media-position]')
    ?.getAttribute('data-gap');
  unmountMedia();

  const { container } = render(
    <Notification
      model={{
        id: 'n1',
        kind: 'mention',
        actor: { id: 'u1', name: 'Ada', fallback: 'A' },
        text: 'mentioned you',
        createdAt: '2026-07-26T10:00:00.000Z',
        read: true,
      }}
    />,
  );
  const notificationGap = container
    .querySelector('[data-media-position][data-size="md"]')
    ?.getAttribute('data-gap');

  expect(identityGap).toBe(mediaScale.md.gap);
  expect(mediaGap).toBe(mediaScale.md.gap);
  expect(notificationGap).toBe(mediaScale.md.gap);
  expect(mediaScale.md.gap).toBe('3');
});

test('Comment at sm resolves the sm mediaScale gap', () => {
  const { container } = render(
    <Comment
      model={{
        id: 'c1',
        author: { id: 'u1', name: 'Ada', fallback: 'A' },
        body: 'Hello',
        createdAt: '2026-07-26T10:00:00.000Z',
        replyCount: 0,
        hasMoreReplies: false,
      }}
      size="sm"
    />,
  );
  // Comment.Root also sets data-size; MediaObject uniquely has media-position.
  const media = container.querySelector(
    '[data-media-position][data-size="sm"]',
  );
  expect(media?.getAttribute('data-gap')).toBe(mediaScale.sm.gap);
  expect(mediaScale.sm.gap).toBe('2');
});

/**
 * Siblings in a column must share one inset. Asserting on *every* padded
 * element, not just the card, also catches a reintroduced inner padding
 * wrapper — which is how Notification came to sit 16px inside its own surface.
 */
test('card composites inherit cardRecipe default padding', () => {
  const expected = cardRecipe.defaults.padding;
  expect(expected).toBe('4');

  const composites = {
    PostCard: (
      <PostCard
        model={{
          id: 'p1',
          author: { id: 'u1', name: 'Ada', fallback: 'A' },
          body: 'Hello',
          createdAt: '2026-07-26T10:00:00.000Z',
        }}
      />
    ),
    ProfileCard: (
      <ProfileCard model={{ identity: { id: 'u1', name: 'Ada', fallback: 'A' } }} />
    ),
    SettingsPanel: (
      <SettingsPanel.Root>
        <SettingsPanel.Section>
          <SettingsPanel.SectionTitle>Account</SettingsPanel.SectionTitle>
        </SettingsPanel.Section>
      </SettingsPanel.Root>
    ),
    Notification: (
      <Notification
        model={{
          id: 'n1',
          kind: 'mention',
          actor: { id: 'u1', name: 'Ada', fallback: 'A' },
          text: 'mentioned you',
          createdAt: '2026-07-26T10:00:00.000Z',
          read: true,
        }}
      />
    ),
  };

  for (const [name, element] of Object.entries(composites)) {
    const { container, unmount } = render(element);
    const paddings = [...container.querySelectorAll('[data-padding]')].map(
      (el) => el.getAttribute('data-padding'),
    );
    expect(paddings.length, name).toBeGreaterThan(0);
    expect(new Set(paddings), name).toEqual(new Set([expected]));
    unmount();
  }
});
