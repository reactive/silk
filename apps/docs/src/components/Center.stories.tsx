import { css } from '@linaria/core';
import { Box, Center, Text, centerRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Layout/Center',
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

const frameClass: string = css`
  height: 10rem;
  border: 1px dashed var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
  background-color: var(--silk-color-surface-raised);
`;

const badgeClass: string = css`
  padding: var(--silk-space-2) var(--silk-space-3);
  border-radius: var(--silk-radius-md);
  background-color: var(--silk-color-tone-accent-subtle);
  color: var(--silk-color-tone-accent-solid);
`;

export const Both: Story = {
  args: {
    axis: 'both',
    className: frameClass,
    children: (
      <Box className={badgeClass}>
        <Text role="label">Centered</Text>
      </Box>
    ),
  },
};

export const Inline: Story = {
  args: {
    axis: 'inline',
    className: frameClass,
    children: (
      <Box className={badgeClass}>
        <Text role="label">Inline axis</Text>
      </Box>
    ),
  },
};
