import { Heading, headingRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { matrixSource } from '../docsSource';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Visual/Heading',
  component: Heading,
  args: {
    children: 'Section title',
    ...headingRecipe.defaults,
  },
  argTypes: {
    level: { control: 'select', options: [...headingRecipe.variants.level] },
    size: { control: 'select', options: [...headingRecipe.variants.size] },
    tone: { control: 'select', options: [...headingRecipe.variants.tone] },
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const SizeMatrix: Story = {
  tags: ['!test'],
  parameters: { controls: { disable: true }, ...matrixSource },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={headingRecipe.variants.size}
      columns={['demo'] as const}
    >
      {(size): JSX.Element => (
        <Heading level="2" size={size}>
          Size {size}
        </Heading>
      )}
    </VariantMatrix>
  ),
};
