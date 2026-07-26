import { css } from '@linaria/core';
import { Box, Text, boxRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties, JSX } from 'react';

const meta = {
  title: 'Components/Layout/Box',
  component: Box,
  tags: ['autodocs'],
  args: {
    ...boxRecipe.defaults,
  },
  argTypes: {
    padding: {
      control: 'select',
      options: [...boxRecipe.variants.padding],
    },
  },
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

const surfaceStyle: CSSProperties = {
  border: '1px solid var(--silk-color-border-subtle)',
  borderRadius: 'var(--silk-radius-md)',
  backgroundColor: 'var(--silk-color-surface-raised)',
};

export const Basic: Story = {
  args: {
    padding: '4',
    style: surfaceStyle,
    children: (
      <Text>
        Box provides box-model reset with semantic surface/text defaults and a
        padding axis from space tokens.
      </Text>
    ),
  },
};

export const AsChild: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Box asChild padding="4" style={surfaceStyle}>
      <section>
        <Text role="heading">Polymorphic via asChild</Text>
        <Text tone="secondary">Renders as a semantic section element.</Text>
      </section>
    </Box>
  ),
};

export const Contain: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Box
      contain
      padding="4"
      style={{ ...surfaceStyle, maxWidth: '20rem' }}
      data-testid="box-contain"
    >
      <Text role="label">contain</Text>
      <Text tone="secondary" role="caption">
        Establishes container-type: inline-size for nested collapseBelow.
      </Text>
    </Box>
  ),
};

const escapeOutlineClass: string = css`
  outline: 2px dashed var(--silk-color-tone-accent-solid);
  outline-offset: 2px;
`;

export const EscapeHatches: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Box
      className={escapeOutlineClass}
      padding="4"
      style={{
        ...surfaceStyle,
        display: 'grid',
        gap: 'var(--silk-space-2)',
        maxWidth: '20rem',
      }}
      data-testid="box-escape"
    >
      <Text role="label">className + style + data-*</Text>
      <Text tone="secondary" role="caption">
        Layout primitive — compose with Stack / Inline / Grid.
      </Text>
    </Box>
  ),
};
