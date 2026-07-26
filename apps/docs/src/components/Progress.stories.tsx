import { Progress, progressRecipe, Stack } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Visual/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: {
    ...progressRecipe.defaults,
    value: 60,
    label: 'Upload progress',
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Indeterminate: Story = {
  args: { value: undefined, label: 'Loading' },
};

export const Tones: Story = {
  render: () => (
    <Stack gap="3">
      {progressRecipe.variants.tone.map((tone) => (
        <Progress key={tone} value={70} tone={tone} label={tone} />
      ))}
    </Stack>
  ),
};
