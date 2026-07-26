import { css } from '@linaria/core';
import { Button, buttonRecipe, cssVars } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Visual/Button',
  component: Button,
  tags: ['autodocs'],
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

const pillClass: string = css`
  --silk-button-bg: var(--silk-color-tone-danger-solid);
  --silk-button-fg: var(--silk-color-tone-danger-on-solid);
  --silk-button-radius: var(--silk-radius-full);

  &:hover:not(:disabled) {
    --silk-button-bg: var(--silk-color-tone-danger-hover);
  }
`;

export const CssVariableOverrides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Set public hooks from a Linaria class. Extracted at build time, no per-render object, and — unlike `style` — able to carry state, media, and container selectors.',
      },
    },
  },
  render: (args): JSX.Element => (
    <Button {...args} className={pillClass}>
      Override hooks
    </Button>
  ),
};

export const RuntimeCssVariables: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When the value is only known at runtime (tenant branding, a computed dimension), `cssVars` types the same hooks for the `style` prop — React `CSSProperties` cannot express custom properties on its own.',
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
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
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
