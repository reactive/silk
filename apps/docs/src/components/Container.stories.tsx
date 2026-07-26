import { css } from '@linaria/core';
import { Box, Container, Stack, Text, containerRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Container',
  component: Container,
  args: {
    ...containerRecipe.defaults,
  },
  argTypes: {
    size: {
      control: 'select',
      options: [...containerRecipe.variants.size],
    },
    padding: {
      control: 'select',
      options: [...containerRecipe.variants.padding],
    },
  },
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<typeof meta>;

const panelClass: string = css`
  padding: var(--silk-space-4);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface-raised);
`;

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      {containerRecipe.variants.size.map((size) => (
        <Container key={size} size={size} padding="3">
          <Box className={panelClass}>
            <Text role="label">size="{size}"</Text>
            <Text tone="secondary" role="caption">
              Centered max-width column with container-type for collapseBelow.
            </Text>
          </Box>
        </Container>
      ))}
    </Stack>
  ),
};

export const Default: Story = {
  args: {
    children: (
      <Box className={panelClass}>
        <Text role="heading">Container</Text>
        <Text tone="secondary">
          Default size is lg with horizontal padding from space tokens.
        </Text>
      </Box>
    ),
  },
};
