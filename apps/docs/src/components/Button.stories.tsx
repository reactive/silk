import { styled } from '@linaria/react';
import { Button, buttonRecipe } from '@reactive/silk';
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

const BrandButton = styled(Button)`
  --silk-button-bg: ${(props) =>
    (props as { readonly 'data-brand'?: string })['data-brand'] ?? ''};
`;

export const RuntimeStyled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dynamic values compile to CSS custom properties on `style` under the hood. Prefer a `data-*` prop (here `data-brand`) so the value is a real attribute — unlike styled-components, Linaria does not strip `$`-prefixed props when wrapping a component. (Linaria’s `styled` typings only expose `style` on the interpolation props object, so the cast is local to the interpolator.)',
      },
    },
  },
  render: (args): JSX.Element => {
    const brandColor = '#7c3aed';

    return (
      <BrandButton {...args} data-brand={brandColor}>
        Runtime hook value
      </BrandButton>
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
