import { Notification, Stack } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Composite/Notification',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {
  render: (): JSX.Element => (
    <Notification
      model={{
        id: 'n1',
        kind: 'mention',
        actor: { id: 'u1', name: 'Ada', fallback: 'A' },
        text: 'mentioned you in a note',
        createdAt: '2026-07-26T10:00:00.000Z',
        read: false,
        href: '#n1',
      }}
    />
  ),
};

export const Read: Story = {
  render: (): JSX.Element => (
    <Stack gap="3">
      <Notification
        model={{
          id: 'n2',
          kind: 'follow',
          actor: { id: 'u2', name: 'Charles', fallback: 'C' },
          text: 'followed you',
          createdAt: '2026-07-26T09:00:00.000Z',
          read: true,
        }}
      />
    </Stack>
  ),
};
