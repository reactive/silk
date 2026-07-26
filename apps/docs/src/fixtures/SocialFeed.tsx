import {
  Avatar,
  Button,
  Card,
  CommentThread,
  Container,
  EmptyState,
  FeedItem,
  Field,
  Heading,
  Input,
  ProfileCard,
  SettingsPanel,
  Stack,
  Surface,
  Switch,
  Text,
  type CommentModel,
  type FeedEntryModel,
  type ProfileModel,
} from '@reactive/silk';
import type { JSX } from 'react';

export type SocialFeedState =
  | 'normal'
  | 'loading'
  | 'empty'
  | 'error'
  | 'longThread'
  | 'narrow'
  | 'reducedMotion';

export interface SocialFeedProps {
  readonly state?: SocialFeedState;
}

const ada = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  meta: '@ada',
  fallback: 'AL',
} as const;

const charles = {
  id: 'u-charles',
  name: 'Charles Babbage',
  meta: '@charles',
  fallback: 'CB',
} as const;

const sampleEntries: FeedEntryModel[] = [
  {
    type: 'post',
    value: {
      id: 'p1',
      author: ada,
      body: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
      createdAt: '2026-07-26T10:00:00.000Z',
      stats: [
        { id: 'likes', label: 'Likes', value: 128 },
        { id: 'replies', label: 'Replies', value: 14 },
      ],
      actions: [
        { id: 'like', label: 'Like' },
        { id: 'reply', label: 'Reply' },
        { id: 'share', label: 'Share' },
      ],
    },
  },
  {
    type: 'notification',
    value: {
      id: 'n1',
      kind: 'mention',
      actor: charles,
      text: 'mentioned you in a note on Difference Engine sketches.',
      createdAt: '2026-07-26T11:00:00.000Z',
      read: false,
      href: '#notification-n1',
    },
  },
  {
    type: 'post',
    value: {
      id: 'p2',
      author: charles,
      body: 'Working through carry mechanisms — still hunting a cleaner carry chain.',
      createdAt: '2026-07-26T09:30:00.000Z',
      stats: [{ id: 'likes', label: 'Likes', value: 42 }],
      actions: [
        { id: 'like', label: 'Like' },
        { id: 'reply', label: 'Reply' },
      ],
    },
  },
];

const longThreadComments: CommentModel[] = [
  {
    id: 'c-root',
    author: ada,
    body: 'Starting a long thread to exercise nested rails and depth caps.',
    createdAt: '2026-07-26T12:00:00.000Z',
    replyCount: 6,
    hasMoreReplies: false,
    replies: deepReplies(6, 'c-root'),
    actions: [
      { id: 'like', label: 'Like' },
      { id: 'reply', label: 'Reply' },
    ],
  },
];

function deepReplies(depth: number, parentId: string): CommentModel[] {
  if (depth <= 0) {
    return [];
  }
  const id = `${parentId}-r${depth}`;
  return [
    {
      id,
      author: depth % 2 === 0 ? ada : charles,
      body:
        depth === 6
          ? 'The punch-card loom is a useful analogy — control flow woven into the fabric.'
          : depth === 5
            ? 'Agreed. The carry chain is where the metaphor breaks down, though.'
            : `A sharper take at depth ${depth}: keep the rail light and the byline compact.`,
      createdAt: '2026-07-26T12:00:00.000Z',
      replyCount: depth > 1 ? 1 : 0,
      hasMoreReplies: false,
      replies: deepReplies(depth - 1, id),
      actions: [
        { id: 'like', label: 'Like' },
        { id: 'reply', label: 'Reply' },
      ],
    },
  ];
}

const profile: ProfileModel = {
  identity: ada,
  bio: 'Mathematician · Writer · First programmer',
  stats: [
    { id: 'followers', label: 'Followers', value: '12.4k' },
    { id: 'following', label: 'Following', value: 240 },
  ],
  actions: [{ id: 'follow', label: 'Follow', tone: 'accent' }],
};

/**
 * Stage 4 exit fixture — social feed assembled from composites alone.
 */
export function SocialFeed({
  state = 'normal',
}: SocialFeedProps): JSX.Element {
  const narrow = state === 'narrow';
  const entries =
    state === 'empty' || state === 'error' ? [] : sampleEntries;

  let body: JSX.Element;
  if (state === 'loading') {
    body = (
      <Stack gap="4" align="stretch" data-region="loading">
        <FeedItem loading />
        <FeedItem loading />
        <FeedItem loading />
      </Stack>
    );
  } else if (state === 'empty') {
    body = (
      <Card elevation="flat" radius="lg" padding="8" data-region="empty">
        <EmptyState
          title="No posts yet"
          description="When people you follow share something, it will show up here."
          media={<Avatar size="lg" fallback="✦" />}
          action={<Button tone="accent">Find people</Button>}
        />
      </Card>
    );
  } else if (state === 'error') {
    body = (
      <Card elevation="flat" radius="lg" padding="8" data-region="error">
        <EmptyState
          title="Couldn’t load the feed"
          description="Something went wrong. Try again in a moment."
          media={<Avatar size="lg" fallback="!" />}
          action={<Button tone="danger">Retry</Button>}
        />
      </Card>
    );
  } else if (state === 'longThread') {
    body = (
      <Stack gap="4" align="stretch" data-region="long-thread">
        <FeedItem entry={sampleEntries[0]!} />
        <Card elevation="flat" radius="lg" padding="4">
          <Stack gap="3" align="stretch">
            <Text role="label" tone="secondary">
              Comments
            </Text>
            <CommentThread comments={longThreadComments} maxDepth={3} />
          </Stack>
        </Card>
      </Stack>
    );
  } else {
    body = (
      <Stack gap="4" align="stretch" data-region="feed">
        {entries.map((entry, index) =>
          state === 'reducedMotion' && index === 0 ? (
            <div key={entry.value.id} data-region="reduced-motion">
              <FeedItem entry={entry} />
            </div>
          ) : (
            <FeedItem key={entry.value.id} entry={entry} />
          ),
        )}
      </Stack>
    );
  }

  return (
    <Surface
      elevation="sunken"
      data-fixture="social-feed"
      data-fixture-state={state}
    >
      <Container size={narrow ? 'sm' : 'md'} padding="5">
        <Stack gap="5" align="stretch">
          <Stack gap="1" align="start">
            <Heading level="1" size="lg">
              Social feed
            </Heading>
            <Text role="caption" tone="secondary">
              What people you follow are sharing
            </Text>
          </Stack>

          <Stack gap="3" align="stretch" data-region="profile">
            <Text role="label" tone="secondary">
              Your profile
            </Text>
            <ProfileCard model={profile} />
          </Stack>

          <Stack gap="3" align="stretch">
            {state !== 'empty' && state !== 'error' ? (
              <Text role="label" tone="secondary">
                {state === 'loading' ? 'Loading' : 'Latest'}
              </Text>
            ) : null}
            {body}
          </Stack>

          <Stack gap="3" align="stretch" data-region="settings">
            <Text role="label" tone="secondary">
              Preferences
            </Text>
            <SettingsPanel.Root>
              <SettingsPanel.Section>
                <SettingsPanel.SectionTitle>
                  Feed preferences
                </SettingsPanel.SectionTitle>
                <SettingsPanel.Row>
                  <Field.Root>
                    <Field.Label>Display name</Field.Label>
                    <Field.Description>
                      Shown on your posts and profile
                    </Field.Description>
                    <Input defaultValue="Ada Lovelace" />
                  </Field.Root>
                </SettingsPanel.Row>
                <SettingsPanel.Row
                  label="Email notifications"
                  description="Mentions and replies"
                  layout="inline"
                >
                  <Switch aria-label="Email notifications" defaultChecked />
                </SettingsPanel.Row>
              </SettingsPanel.Section>
            </SettingsPanel.Root>
          </Stack>
        </Stack>
      </Container>
    </Surface>
  );
}
