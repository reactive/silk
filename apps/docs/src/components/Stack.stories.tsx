import { Button, Inline, Stack, Text, stackRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { withSource } from '../docsSource';
import { DemoItems, tallFrameClass } from './Stack.demo';
import stackDemoSource from './Stack.demo.tsx?raw';

const meta = {
  title: 'Components/Layout/Stack',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'Stack is vertical-only, so `align` is always the horizontal axis and `justify` always the vertical one. For horizontal flow reach for `Inline`.',
      },
      ...withSource(stackDemoSource).docs,
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

export const Column: Story = {
  args: {
    gap: '3',
    children: <DemoItems />,
  },
};

export const Align: Story = {
  args: {
    gap: '3',
    align: 'center',
    children: <DemoItems />,
  },
};

export const Justify: Story = {
  args: {
    gap: '3',
    align: 'start',
    justify: 'between',
    className: tallFrameClass,
    children: <DemoItems />,
  },
};

export const Rail: Story = {
  args: {
    gap: '2',
    rail: 'start',
    children: <DemoItems />,
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
