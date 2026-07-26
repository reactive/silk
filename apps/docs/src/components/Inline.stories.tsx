import { css } from '@linaria/core';
import { Box, Button, Inline, Text, inlineRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Layout/Inline',
  component: Inline,
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

const chipClass: string = css`
  padding: var(--silk-space-1) var(--silk-space-2);
  border-radius: var(--silk-radius-full);
  /* solid/on-solid — subtle+solid fails WCAG AA at 16px */
  background-color: var(--silk-color-tone-accent-solid);
  color: var(--silk-color-tone-accent-on-solid);
`;

const fullWidthClass: string = css`
  width: 100%;
`;

const narrowClass: string = css`
  max-width: 14rem;
`;

export const Default: Story = {
  args: {
    children: (
      <>
        <Box className={chipClass}>Alpha</Box>
        <Box className={chipClass}>Beta</Box>
        <Box className={chipClass}>Gamma</Box>
        <Box className={chipClass}>Delta</Box>
      </>
    ),
  },
};

export const JustifyBetween: Story = {
  args: {
    justify: 'between',
    wrap: 'nowrap',
    className: fullWidthClass,
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
    className: narrowClass,
    children: (
      <>
        {['Design', 'Systems', 'Tokens', 'Recipes', 'Layout', 'Density'].map(
          (label) => (
            <Box key={label} className={chipClass}>
              {label}
            </Box>
          ),
        )}
      </>
    ),
  },
};
