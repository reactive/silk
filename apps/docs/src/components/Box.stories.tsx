import { css, cx } from '@linaria/core';
import { Box, Text, boxRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Layout/Box',
  component: Box,
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

const surfaceClass: string = css`
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
  background-color: var(--silk-color-surface-raised);
`;

const narrowClass: string = css`
  max-width: 20rem;
`;

const escapeOutlineClass: string = css`
  display: grid;
  gap: var(--silk-space-2);
  outline: 2px dashed var(--silk-color-tone-accent-solid);
  outline-offset: 2px;
`;

export const Basic: Story = {
  args: {
    padding: '4',
    className: surfaceClass,
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
    <Box asChild padding="4" className={surfaceClass}>
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
      className={cx(surfaceClass, narrowClass)}
      data-testid="box-contain"
    >
      <Text role="label">contain</Text>
      <Text tone="secondary" role="caption">
        Establishes container-type: inline-size for nested collapseBelow.
      </Text>
    </Box>
  ),
};

export const ClassComposition: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Prefer `css` + `cx` when styles are mixins to stack — not a new component type. See Button → StyledOverrides for the `styled(Component)` path.',
      },
    },
  },
  render: (): JSX.Element => (
    <Box
      className={cx(surfaceClass, narrowClass, escapeOutlineClass)}
      padding="4"
      data-testid="box-escape"
    >
      <Text role="label">css + cx</Text>
      <Text tone="secondary" role="caption">
        Independent classes composed onto one host.
      </Text>
    </Box>
  ),
};
