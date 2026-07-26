import { Card, cardRecipe, Heading, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Visual/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    ...cardRecipe.defaults,
    children: (
      <>
        <Heading level="3" size="sm">
          Card title
        </Heading>
        <Text tone="secondary">Card body with raised elevation by default.</Text>
      </>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const AsLink: Story = {
  args: {
    asChild: true,
    children: (
      <a href="#card">
        <Heading level="3" size="sm">
          Interactive card
        </Heading>
        <Text tone="secondary">Composed via asChild around a real link.</Text>
      </a>
    ),
  },
};

export const Flat: Story = {
  args: { elevation: 'flat' },
};
