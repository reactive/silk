import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withSource } from '../docsSource';
import {
  NativeSettingsForm,
  nativeSettingsFormStates,
} from './NativeSettingsForm';
import nativeSettingsFormSource from './NativeSettingsForm.tsx?raw';

const meta = {
  title: 'Fixtures/NativeSettingsForm',
  component: NativeSettingsForm,
  parameters: withSource(nativeSettingsFormSource),
  args: { state: 'normal' },
  argTypes: {
    state: {
      control: 'select',
      options: [...nativeSettingsFormStates],
    },
  },
} satisfies Meta<typeof NativeSettingsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Error: Story = { args: { state: 'error' } };

// Field.Root applies opacity when disabled, which drops label/description
// contrast below WCAG AA. Tracked as a token/style burn-down item.
const disabledContrastTodo = { a11y: { test: 'todo' as const } };

export const Disabled: Story = {
  args: { state: 'disabled' },
  parameters: disabledContrastTodo,
};

export const InvalidDisabled: Story = {
  args: { state: 'invalidDisabled' },
  parameters: disabledContrastTodo,
};
export const Compact: Story = { args: { state: 'compact' } };
export const Dark: Story = { args: { state: 'dark' } };
export const ReducedMotion: Story = { args: { state: 'reducedMotion' } };
export const LongContent: Story = { args: { state: 'longContent' } };
export const Rtl: Story = { args: { state: 'rtl' } };
export const Indeterminate: Story = { args: { state: 'indeterminate' } };
