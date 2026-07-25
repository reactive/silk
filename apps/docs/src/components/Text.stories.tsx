import { Stack, Text, textRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
    ...textRecipe.defaults,
  },
  argTypes: {
    role: {
      control: 'select',
      options: [...textRecipe.variants.role],
      description: 'Typography role (not the ARIA role). Use asChild for custom elements/ARIA.',
    },
    tone: {
      control: 'select',
      options: [...textRecipe.variants.tone],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const RoleToneMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={textRecipe.variants.role}
      columns={textRecipe.variants.tone}
      align="baseline"
      columnWidth="minmax(8rem, 1fr)"
    >
      {(role, tone): JSX.Element => (
        <Text role={role} tone={tone}>
          {role}
        </Text>
      )}
    </VariantMatrix>
  ),
};

export const Hierarchy: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="2">
      <Text role="headingLg">Heading large</Text>
      <Text role="heading">Heading</Text>
      <Text role="body">Body copy for paragraphs and long-form content.</Text>
      <Text role="bodySm" tone="secondary">
        Smaller body for dense UI.
      </Text>
      <Text role="label">Label</Text>
      <Text role="caption" tone="secondary">
        Caption / helper text
      </Text>
    </Stack>
  ),
};
