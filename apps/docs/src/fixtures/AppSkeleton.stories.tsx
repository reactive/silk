import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { AppSkeleton, type AppSkeletonState } from './AppSkeleton';

const states: AppSkeletonState[] = [
  'normal',
  'sidebarCollapse',
  'overflow',
  'longContent',
  'compactDensity',
];

const meta = {
  title: 'Fixtures/AppSkeleton',
  component: AppSkeleton,
  argTypes: {
    state: {
      control: 'select',
      options: states,
    },
  },
  args: {
    state: 'normal',
  },
} satisfies Meta<typeof AppSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: { state: 'normal' },
};

export const SidebarCollapse: Story = {
  args: { state: 'sidebarCollapse' },
};

export const Overflow: Story = {
  args: { state: 'overflow' },
};

export const LongContent: Story = {
  args: { state: 'longContent' },
};

export const CompactDensity: Story = {
  args: { state: 'compactDensity' },
};
