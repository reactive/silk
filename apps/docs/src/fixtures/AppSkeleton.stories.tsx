import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withSource } from '../docsSource';
import { AppSkeleton, type AppSkeletonState } from './AppSkeleton';
import appSkeletonSource from './AppSkeleton.tsx?raw';

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
  parameters: withSource(appSkeletonSource),
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
