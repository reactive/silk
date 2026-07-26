import { Avatar, MediaObject, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Composite/MediaObject',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (): JSX.Element => (
    <MediaObject media={<Avatar fallback="AL" />}>
      <Text role="label">Ada Lovelace</Text>
      <Text role="caption" tone="secondary">
        Beside content
      </Text>
    </MediaObject>
  ),
};

export const MediaEnd: Story = {
  render: (): JSX.Element => (
    <MediaObject media={<Avatar fallback="AL" />} mediaPosition="end">
      <Text role="label">Ada Lovelace</Text>
      <Text role="caption" tone="secondary">
        Media on the end
      </Text>
    </MediaObject>
  ),
};
