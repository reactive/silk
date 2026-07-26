import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { SocialFeed, type SocialFeedState } from './SocialFeed';

const states: SocialFeedState[] = [
  'normal',
  'loading',
  'empty',
  'error',
  'longThread',
  'narrow',
  'reducedMotion',
];

const meta = {
  title: 'Fixtures/SocialFeed',
  component: SocialFeed,
  argTypes: {
    state: { control: 'select', options: states },
  },
  args: { state: 'normal' },
} satisfies Meta<typeof SocialFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { state: 'normal' } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorState: Story = { args: { state: 'error' } };
export const LongThread: Story = { args: { state: 'longThread' } };
export const Narrow: Story = { args: { state: 'narrow' } };
export const ReducedMotion: Story = {
  args: { state: 'reducedMotion' },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
};
