import { Grid, gridRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withSource } from '../docsSource';
import { Cells } from './Grid.demo';
import gridDemoSource from './Grid.demo.tsx?raw';

const meta = {
  title: 'Components/Layout/Grid',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component:
          'Both `align` and `justify` place an item inside its own track (`align-items` / `justify-items`). Tracks are always `1fr`, so there is no free space to distribute — this is the one place `justify` means item placement rather than content distribution.',
      },
      ...withSource(gridDemoSource).docs,
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
