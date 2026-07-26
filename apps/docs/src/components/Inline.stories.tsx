import { Box, Button, Inline, Text, inlineRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties, JSX } from 'react';

const meta = {
  title: 'Components/Inline',
  component: Inline,
  tags: ['autodocs'],
  args: {
    ...inlineRecipe.defaults,
  },
  argTypes: {
    gap: {
      control: 'select',
      options: [...inlineRecipe.variants.gap],
    },
    align: {
      control: 'select',
      options: [...inlineRecipe.variants.align],
    },
    justify: {
      control: 'select',
      options: [...inlineRecipe.variants.justify],
    },
    wrap: {
      control: 'select',
      options: [...inlineRecipe.variants.wrap],
    },
    collapseBelow: {
      control: 'select',
      options: [false, 'xs', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Inline>;

export default meta;

type Story = StoryObj<typeof meta>;

const chipStyle: CSSProperties = {
  padding: 'var(--silk-space-1) var(--silk-space-2)',
  borderRadius: 'var(--silk-radius-full)',
  backgroundColor: 'var(--silk-color-tone-accent-subtle)',
  color: 'var(--silk-color-tone-accent-solid)',
};

export const Default: Story = {
  args: {
    children: (
      <>
        <Box style={chipStyle}>Alpha</Box>
        <Box style={chipStyle}>Beta</Box>
        <Box style={chipStyle}>Gamma</Box>
        <Box style={chipStyle}>Delta</Box>
      </>
    ),
  },
};

export const JustifyBetween: Story = {
  args: {
    justify: 'between',
    wrap: 'nowrap',
    style: { width: '100%' },
    children: (
      <>
        <Text role="label">Filters</Text>
        <Inline gap="2">
          <Button size="sm" variant="soft">
            All
          </Button>
          <Button size="sm" variant="ghost" tone="neutral">
            Active
          </Button>
        </Inline>
      </>
    ),
  },
};

export const Wrap: Story = {
  args: {
    style: { maxWidth: '14rem' },
    children: (
      <>
        {['Design', 'Systems', 'Tokens', 'Recipes', 'Layout', 'Density'].map(
          (label) => (
            <Box key={label} style={chipStyle}>
              {label}
            </Box>
          ),
        )}
      </>
    ),
  },
};
