import { css } from '@linaria/core';
import { Box, Button, Inline, Text, inlineRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Inline',
  component: Inline,
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal flow, wrapping by default. `align` is the vertical axis and `justify` the horizontal one. `collapseBelow` turns the row into a stretched column below the breakpoint, but it does not touch `justify-content` — a `justify` set for the row still applies to the vertical axis once collapsed.',
      },
    },
  },
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
    direction: {
      control: 'select',
      options: [...inlineRecipe.variants.direction],
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

const collapseFrameClass: string = css`
  max-width: 20rem;
  padding: var(--silk-space-3);
  border: 1px dashed var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
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

export const CollapseBelow: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Box contain className={collapseFrameClass}>
      <Inline gap="3" align="center" wrap="nowrap" collapseBelow="md">
        <Box className={chipClass}>One</Box>
        <Box className={chipClass}>Two</Box>
        <Box className={chipClass}>Three</Box>
      </Inline>
      <Text tone="secondary" role="caption">
        Resize the container — row collapses to a stretched column below md
        (768px).
      </Text>
    </Box>
  ),
};
