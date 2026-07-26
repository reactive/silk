import { buttonRecipe } from '@reactive/silk-core';
import { Button } from '@reactive/silk-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Button',
  component: Button,
  decorators: [withNativeSilk],
  args: {
    children: 'Save',
    ...buttonRecipe.defaults,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [...buttonRecipe.variants.variant],
    },
    tone: {
      control: 'select',
      options: [...buttonRecipe.variants.tone],
    },
    size: {
      control: 'select',
      options: [...buttonRecipe.variants.size],
    },
    density: {
      control: 'select',
      options: [...buttonRecipe.variants.density],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SoftDanger: Story = {
  args: { variant: 'soft', tone: 'danger', size: 'sm' },
};

export const StyleEscapeHatch: Story = {
  args: {
    style: { opacity: 0.75 },
    children: 'Styled',
  },
};
