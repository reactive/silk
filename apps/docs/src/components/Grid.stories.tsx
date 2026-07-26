import { Box, Grid, Text, gridRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties, JSX } from 'react';

const meta = {
  title: 'Components/Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
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
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

const cellStyle: CSSProperties = {
  padding: 'var(--silk-space-3)',
  borderRadius: 'var(--silk-radius-md)',
  border: '1px solid var(--silk-color-border-subtle)',
  backgroundColor: 'var(--silk-color-surface-raised)',
};

function Cells({ count }: { readonly count: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} style={cellStyle}>
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
