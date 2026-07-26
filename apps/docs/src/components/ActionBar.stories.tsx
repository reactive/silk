import { ActionBar } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/ActionBar',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: () => (
    <ActionBar.Root aria-label="Post actions">
      <ActionBar.Action>Like</ActionBar.Action>
      <ActionBar.Action>Reply</ActionBar.Action>
      <ActionBar.Spacer />
      <ActionBar.Action tone="danger">Report</ActionBar.Action>
    </ActionBar.Root>
  ),
};
