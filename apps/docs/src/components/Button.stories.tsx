import { styled } from '@linaria/react';
import { Button, buttonRecipe, cssVars } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { matrixSource } from '../docsSource';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Visual/Button',
  component: Button,
  args: {
    children: 'Save',
    ...buttonRecipe.defaults,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [...buttonRecipe.variants.variant],
    },
    tone: {
      control: 'select',
      options: [...buttonRecipe.variants.tone],
    },
    size: {
      control: 'select',
      options: [...buttonRecipe.variants.size],
    },
    density: {
      control: 'select',
      options: [...buttonRecipe.variants.density],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const AriaDisabled: Story = {
  args: {
    'aria-disabled': true,
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="#save">Save as link</a>,
  },
};

const DangerPill = styled(Button)`
  --silk-button-bg: var(--silk-color-tone-danger-solid);
  --silk-button-fg: var(--silk-color-tone-danger-on-solid);
  --silk-button-radius: var(--silk-radius-full);

  &:hover:not(:disabled) {
    --silk-button-bg: var(--silk-color-tone-danger-hover);
  }
`;

export const StyledOverrides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Customize with `styled(Button)` from `@linaria/react`. Sets public CSS variable hooks; extracted at build time and able to carry state, media, and container selectors.',
      },
    },
  },
  render: (args): JSX.Element => (
    <DangerPill {...args}>Override hooks</DangerPill>
  ),
};

export const RuntimeCssVariables: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When the value is only known at runtime, `cssVars` types the public hooks for the `style` prop. Prefer `styled` (above) for reusable static overrides.',
      },
    },
  },
  render: (args): JSX.Element => {
    const brandColor = '#7c3aed';

    return (
      <Button {...args} style={cssVars({ '--silk-button-bg': brandColor })}>
        Runtime hook value
      </Button>
    );
  },
};

export const VariantToneMatrix: Story = {
  tags: ['!test'],
  parameters: { controls: { disable: true }, ...matrixSource },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={buttonRecipe.variants.variant}
      columns={buttonRecipe.variants.tone}
    >
      {(variant, tone): JSX.Element => (
        <Button variant={variant} tone={tone}>
          {variant}
        </Button>
      )}
    </VariantMatrix>
  ),
};

export const SizeDensityMatrix: Story = {
  tags: ['!test'],
  parameters: { controls: { disable: true }, ...matrixSource },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={buttonRecipe.variants.size}
      columns={buttonRecipe.variants.density}
    >
      {(size, density): JSX.Element => (
        <Button size={size} density={density}>
          {size}/{density}
        </Button>
      )}
    </VariantMatrix>
  ),
};
