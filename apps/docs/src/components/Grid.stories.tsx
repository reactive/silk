import { css } from '@linaria/core';
import { Box, Grid, Text, gridRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Grid',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component:
          'Both `align` and `justify` place an item inside its own track (`align-items` / `justify-items`). Tracks are always `1fr`, so there is no free space to distribute — this is the one place `justify` means item placement rather than content distribution.',
      },
    },
  },
  args: {
    ...gridRecipe.defaults,
  },
  argTypes: {
    columns: {
      control: 'select',
      options: [...gridRecipe.variants.columns],
    },
    gap: {
      control: 'select',
      options: [...gridRecipe.variants.gap],
    },
    align: {
      control: 'select',
      options: [...gridRecipe.variants.align],
    },
    justify: {
      control: 'select',
      options: [...gridRecipe.variants.justify],
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

const cellClass: string = css`
  padding: var(--silk-space-3);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface-raised);
`;

function Cells({ count }: { readonly count: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} className={cellClass}>
          <Text role="label">Cell {i + 1}</Text>
          <Text tone="secondary" role="caption">
            Grid track
          </Text>
        </Box>
      ))}
    </>
  );
}

export const FixedColumns: Story = {
  args: {
    columns: '3',
    gap: '3',
    children: <Cells count={6} />,
  },
};

export const AutoFill: Story = {
  args: {
    columns: 'auto',
    gap: '3',
    minColumnWidth: '10rem',
    children: <Cells count={8} />,
  },
};

export const ItemPlacement: Story = {
  args: {
    columns: '3',
    gap: '3',
    align: 'center',
    justify: 'center',
    children: <Cells count={6} />,
  },
};
