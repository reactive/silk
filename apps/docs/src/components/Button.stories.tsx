import { Button, buttonRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { CSSProperties, JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Button',
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

export const CssVariableOverrides: Story = {
  render: (args): JSX.Element => {
    // Custom properties are not expressible in React's CSSProperties.
    const style = {
      '--silk-button-bg': 'var(--silk-color-tone-danger-solid)',
      '--silk-button-fg': 'var(--silk-color-tone-danger-on-solid)',
      '--silk-button-radius': 'var(--silk-radius-full)',
    } as CSSProperties;

    return (
      <Button {...args} style={style}>
        Override hooks
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
