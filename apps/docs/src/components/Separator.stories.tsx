import { css } from '@linaria/core';
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

const narrowClass: string = css`
  max-width: 24rem;
`;

const tallClass: string = css`
  height: 3rem;
`;

const fullHeightClass: string = css`
  height: 100%;
`;

export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="3" className={narrowClass}>
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
    <Inline gap="3" align="center" wrap="nowrap" className={tallClass}>
      <Text role="label">Left</Text>
      <Separator orientation="vertical" />
      <Text role="label">Right</Text>
      <Box className={fullHeightClass}>
        <Separator orientation="vertical" />
      </Box>
      <Text tone="secondary" role="caption">
        Subtle border token
      </Text>
    </Inline>
  ),
};
