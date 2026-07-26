import { css } from '@linaria/core';
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

const paddedClass: string = css`
  padding: var(--silk-space-4);
`;

const matrixClass: string = css`
  padding: var(--silk-space-4);
  min-width: 8rem;
`;

export const Primary: Story = {
  args: {
    className: paddedClass,
  },
};

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
          className={matrixClass}
        >
          <Text>{elevation}</Text>
        </Surface>
      )}
    </VariantMatrix>
  ),
};
