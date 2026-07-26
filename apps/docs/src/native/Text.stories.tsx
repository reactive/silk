import { textRecipe } from '@reactive/silk-core';
import { Text } from '@reactive/silk-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Text',
  component: Text,
  decorators: [withNativeSilk],
  args: {
    children: 'The quick brown fox',
    ...textRecipe.defaults,
  },
  argTypes: {
    role: { control: 'select', options: [...textRecipe.variants.role] },
    tone: { control: 'select', options: [...textRecipe.variants.tone] },
    measure: { control: 'select', options: [...textRecipe.variants.measure] },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Heading: Story = {
  args: { role: 'headingLg', children: 'Heading' },
};

export const ProseMeasure: Story = {
  args: {
    measure: 'prose',
    tone: 'secondary',
    children: Array.from({ length: 40 }, () => 'word').join(' '),
  },
};

export const SuccessTone: Story = {
  args: { tone: 'success', children: 'Success' },
};
