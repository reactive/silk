import { styled } from '@linaria/react';
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

const Cell = styled(Box)`
  padding: var(--silk-space-3);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface-raised);
`;

function cells(count: number): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Cell key={i}>
          <Text role="label">Cell {i + 1}</Text>
          <Text tone="secondary" role="caption">
            Grid track
          </Text>
        </Cell>
      ))}
    </>
  );
}

export const FixedColumns: Story = {
  args: {
    columns: '3',
    gap: '3',
    children: cells(6),
  },
};

export const AutoFill: Story = {
  args: {
    columns: 'auto',
    gap: '3',
    minColumnWidth: '10rem',
    children: cells(8),
  },
};

export const ItemPlacement: Story = {
  args: {
    columns: '3',
    gap: '3',
    align: 'center',
    justify: 'center',
    children: cells(6),
  },
};
