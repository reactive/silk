import { Box, Center, Text, centerRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties } from 'react';

const meta = {
  title: 'Components/Center',
  component: Center,
  tags: ['autodocs'],
  args: {
    ...centerRecipe.defaults,
  },
  argTypes: {
    axis: {
      control: 'select',
      options: [...centerRecipe.variants.axis],
    },
  },
} satisfies Meta<typeof Center>;

export default meta;

type Story = StoryObj<typeof meta>;

const frameStyle: CSSProperties = {
  height: '10rem',
  border: '1px dashed var(--silk-color-border-subtle)',
  borderRadius: 'var(--silk-radius-md)',
  backgroundColor: 'var(--silk-color-surface-raised)',
};

const badgeStyle: CSSProperties = {
  padding: 'var(--silk-space-2) var(--silk-space-3)',
  borderRadius: 'var(--silk-radius-md)',
  backgroundColor: 'var(--silk-color-tone-accent-subtle)',
  color: 'var(--silk-color-tone-accent-solid)',
};

export const Both: Story = {
  args: {
    axis: 'both',
    style: frameStyle,
    children: (
      <Box style={badgeStyle}>
        <Text role="label">Centered</Text>
      </Box>
    ),
  },
};

export const Inline: Story = {
  args: {
    axis: 'inline',
    style: frameStyle,
    children: (
      <Box style={badgeStyle}>
        <Text role="label">Inline axis</Text>
      </Box>
    ),
  },
};
