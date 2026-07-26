import { Badge, badgeRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { matrixSource } from '../docsSource';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Visual/Badge',
  component: Badge,
  args: {
    children: 'Badge',
    ...badgeRecipe.defaults,
  },
  argTypes: {
    variant: { control: 'select', options: [...badgeRecipe.variants.variant] },
    tone: { control: 'select', options: [...badgeRecipe.variants.tone] },
    size: { control: 'select', options: [...badgeRecipe.variants.size] },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const VariantToneMatrix: Story = {
  tags: ['!test'],
  parameters: { controls: { disable: true }, ...matrixSource },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={badgeRecipe.variants.variant}
      columns={badgeRecipe.variants.tone}
    >
      {(variant, tone): JSX.Element => (
        <Badge variant={variant} tone={tone}>
          {tone}
        </Badge>
      )}
    </VariantMatrix>
  ),
};
