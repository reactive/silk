import { ProfileCard } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/ProfileCard',
  component: ProfileCard,
  args: {
    model: {
      identity: {
        id: 'u1',
        name: 'Ada Lovelace',
        meta: '@ada',
        fallback: 'AL',
      },
      bio: 'Mathematician · Writer · First programmer',
      stats: [
        { id: 'followers', label: 'Followers', value: '12.4k' },
        { id: 'following', label: 'Following', value: 240 },
      ],
      actions: [{ id: 'follow', label: 'Follow', tone: 'accent' as const }],
    },
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stacked: Story = {};
export const Horizontal: Story = { args: { layout: 'horizontal' } };
