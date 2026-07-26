import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { SettingsForm, type SettingsFormState } from './SettingsForm';

const states: SettingsFormState[] = [
  'normal',
  'error',
  'disabled',
  'loading',
  'reducedMotion',
  'narrowLongContent',
];

const meta = {
  title: 'Fixtures/SettingsForm',
  component: SettingsForm,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: states,
    },
  },
  args: {
    state: 'normal',
  },
} satisfies Meta<typeof SettingsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: { state: 'normal' },
};

export const Error: Story = {
  args: { state: 'error' },
};

export const Disabled: Story = {
  args: { state: 'disabled' },
};

export const Loading: Story = {
  args: { state: 'loading' },
};

export const ReducedMotion: Story = {
  args: { state: 'reducedMotion' },
  parameters: {
    // Emulate the UA preference when capturing with Chromatic; Silk motion
    // primitives respond only to prefers-reduced-motion (no override prop).
    chromatic: { prefersReducedMotion: 'reduce' },
    docs: {
      description: {
        story:
          'Keeps the settings form and adds a motion-preview region (Skeleton, Spinner, indeterminate Progress). Silk disables those animations under `prefers-reduced-motion: reduce` — enable that OS preference or capture with Chromatic to verify the reduced presentation.',
      },
    },
  },
};

export const NarrowLongContent: Story = {
  args: { state: 'narrowLongContent' },
};
