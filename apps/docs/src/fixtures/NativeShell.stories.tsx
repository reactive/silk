import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withSource } from '../docsSource';
import { NativeShell, nativeShellStates } from './NativeShell';
import nativeShellSource from './NativeShell.tsx?raw';

const meta = {
  title: 'Fixtures/NativeShell',
  component: NativeShell,
  parameters: withSource(nativeShellSource),
  argTypes: {
    state: { control: 'select', options: nativeShellStates },
  },
  args: { state: 'normal' },
} satisfies Meta<typeof NativeShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { state: 'normal' } };
export const Compact: Story = { args: { state: 'compact' } };
export const Dark: Story = { args: { state: 'dark' } };
export const Tenant: Story = { args: { state: 'tenant' } };
export const Nested: Story = { args: { state: 'nested' } };
export const LongContent: Story = { args: { state: 'longContent' } };
export const Disabled: Story = { args: { state: 'disabled' } };
