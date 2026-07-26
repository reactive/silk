import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { Box, Button, Inline, Stack, Text, stackRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Stack',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'Stack is vertical-only, so `align` is always the horizontal axis and `justify` always the vertical one. For horizontal flow reach for `Inline`.',
      },
    },
  },
  args: {
    ...stackRecipe.defaults,
  },
  argTypes: {
    gap: {
      control: 'select',
      options: [...stackRecipe.variants.gap],
    },
    align: {
      control: 'select',
      options: [...stackRecipe.variants.align],
    },
    justify: {
      control: 'select',
      options: [...stackRecipe.variants.justify],
    },
    rail: {
      control: 'select',
      options: [...stackRecipe.variants.rail],
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

const DemoItem = styled(Box)`
  padding: var(--silk-space-2) var(--silk-space-3);
  border-radius: var(--silk-radius-sm);
  /* solid/on-solid — subtle+solid fails WCAG AA at 16px */
  background-color: var(--silk-color-tone-accent-solid);
  color: var(--silk-color-tone-accent-on-solid);
`;

const tallFrameClass: string = css`
  height: 14rem;
  padding: var(--silk-space-3);
  border: 1px dashed var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
`;

const demoItems = (
  <>
    <DemoItem>One</DemoItem>
    <DemoItem>Two</DemoItem>
    <DemoItem>Three</DemoItem>
  </>
);

export const Column: Story = {
  args: {
    gap: '3',
    children: demoItems,
  },
};

export const Align: Story = {
  args: {
    gap: '3',
    align: 'center',
    children: demoItems,
  },
};

export const Justify: Story = {
  args: {
    gap: '3',
    align: 'start',
    justify: 'between',
    className: tallFrameClass,
    children: demoItems,
  },
};

export const Rail: Story = {
  args: {
    gap: '2',
    rail: 'start',
    children: demoItems,
  },
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      <Text role="heading">Stack composition</Text>
      <Inline gap="2" align="center">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="outline" tone="neutral">
          Secondary
        </Button>
      </Inline>
      <Text tone="secondary" role="caption">
        Gap and align resolve through space tokens and recipe defaults.
      </Text>
    </Stack>
  ),
};
