import { Spinner, spinnerRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Visual/Spinner',
  component: Spinner,
  args: { ...spinnerRecipe.defaults },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Large: Story = {
  args: { size: 'lg', label: 'Loading content' },
};
