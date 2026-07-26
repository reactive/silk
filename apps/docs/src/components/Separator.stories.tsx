import {
  Box,
  Inline,
  Separator,
  Stack,
  Text,
  separatorRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Separator',
  component: Separator,
  tags: ['autodocs'],
  args: {
    ...separatorRecipe.defaults,
    decorative: true,
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: [...separatorRecipe.variants.orientation],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="3" style={{ maxWidth: '24rem' }}>
      <Text role="heading">Section A</Text>
      <Text tone="secondary">Content above the separator.</Text>
      <Separator />
      <Text role="heading">Section B</Text>
      <Text tone="secondary">Content below the separator.</Text>
    </Stack>
  ),
};

export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Inline gap="3" align="center" wrap="nowrap" style={{ height: '3rem' }}>
      <Text role="label">Left</Text>
      <Separator orientation="vertical" />
      <Text role="label">Right</Text>
      <Box style={{ height: '100%' }}>
        <Separator orientation="vertical" />
      </Box>
      <Text tone="secondary" role="caption">
        Subtle border token
      </Text>
    </Inline>
  ),
};
