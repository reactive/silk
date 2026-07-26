import { Box, Button, Stack, Text, stackRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties, JSX } from 'react';

const meta = {
  title: 'Components/Stack',
  component: Stack,
  tags: ['autodocs'],
  args: {
    ...stackRecipe.defaults,
  },
  argTypes: {
    direction: {
      control: 'select',
      options: [...stackRecipe.variants.direction],
    },
    gap: {
      control: 'select',
      options: [...stackRecipe.variants.gap],
    },
    align: {
      control: 'select',
      options: [...stackRecipe.variants.align],
    },
    wrap: {
      control: 'select',
      options: [...stackRecipe.variants.wrap],
    },
    collapseBelow: {
      control: 'select',
      options: [false, 'xs', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemStyle: CSSProperties = {
  padding: 'var(--silk-space-2) var(--silk-space-3)',
  borderRadius: 'var(--silk-radius-sm)',
  backgroundColor: 'var(--silk-color-tone-accent-subtle)',
  color: 'var(--silk-color-tone-accent-solid)',
};

function DemoItems(): JSX.Element {
  return (
    <>
      <Box style={itemStyle}>One</Box>
      <Box style={itemStyle}>Two</Box>
      <Box style={itemStyle}>Three</Box>
    </>
  );
}

export const Column: Story = {
  args: {
    gap: '3',
    children: <DemoItems />,
  },
};

export const Row: Story = {
  args: {
    direction: 'row',
    gap: '2',
    align: 'center',
    children: <DemoItems />,
  },
};

export const Wrap: Story = {
  args: {
    direction: 'row',
    gap: '2',
    wrap: 'wrap',
    style: { maxWidth: '12rem' },
    children: (
      <>
        <DemoItems />
        <DemoItems />
      </>
    ),
  },
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      <Text role="heading">Stack composition</Text>
      <Stack direction="row" gap="2" align="center">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="outline" tone="neutral">
          Secondary
        </Button>
      </Stack>
      <Text tone="secondary" role="caption">
        Gap and align resolve through space tokens and recipe defaults.
      </Text>
    </Stack>
  ),
};

export const CollapseBelow: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Box
      contain
      style={{
        maxWidth: '20rem',
        padding: 'var(--silk-space-3)',
        border: '1px dashed var(--silk-color-border-subtle)',
        borderRadius: 'var(--silk-radius-md)',
      }}
    >
      <Stack direction="row" gap="3" collapseBelow="md" align="center">
        <DemoItems />
      </Stack>
      <Text tone="secondary" role="caption">
        Resize the container — row collapses to column below md (768px).
      </Text>
    </Box>
  ),
};
