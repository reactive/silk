import { Surface, surfaceRecipe, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Visual/Surface',
  component: Surface,
  tags: ['autodocs'],
  args: {
    ...surfaceRecipe.defaults,
    children: <Text>Surface content</Text>,
    style: { padding: 'var(--silk-space-4)' },
  },
  argTypes: {
    elevation: {
      control: 'select',
      options: [...surfaceRecipe.variants.elevation],
    },
    radius: {
      control: 'select',
      options: [...surfaceRecipe.variants.radius],
    },
    border: {
      control: 'select',
      options: [...surfaceRecipe.variants.border],
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const ElevationMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={surfaceRecipe.variants.elevation}
      columns={['demo'] as const}
    >
      {(elevation): JSX.Element => (
        <Surface
          elevation={elevation}
          border="subtle"
          style={{ padding: 'var(--silk-space-4)', minWidth: '8rem' }}
        >
          <Text>{elevation}</Text>
        </Surface>
      )}
    </VariantMatrix>
  ),
};
