import { Identity, Stack, avatarRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Composite/Identity',
  component: Identity,
  args: {
    name: 'Ada Lovelace',
    meta: '@ada',
    fallback: 'AL',
    size: avatarRecipe.defaults.size,
  },
  argTypes: {
    size: {
      control: 'select',
      options: [...avatarRecipe.variants.size],
    },
  },
} satisfies Meta<typeof Identity>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Convenience: Story = {};

export const WithoutMeta: Story = {
  args: {
    meta: undefined,
  },
};

export const WithImage: Story = {
  args: {
    avatar: 'https://avatars.githubusercontent.com/u/810438?v=4',
    avatarAlt: 'Example user',
    name: 'Example User',
    meta: '@example',
    fallback: 'EX',
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      {avatarRecipe.variants.size.map((size) => (
        <Identity
          key={size}
          size={size}
          name={`Size ${size}`}
          meta={`size=${size}`}
          fallback={size.toUpperCase()}
        />
      ))}
    </Stack>
  ),
};

export const Compound: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Identity.Root size="lg">
      <Identity.Avatar fallback="CL" />
      <Stack gap="0" align="start">
        <Identity.Name>Compound Lovelace</Identity.Name>
        <Identity.Meta>Built from parts</Identity.Meta>
      </Stack>
    </Identity.Root>
  ),
};

export const FallbackOnly: Story = {
  args: {
    fallback: 'SB',
    name: 'Storybook Bot',
    meta: 'docs composite',
  },
};

export const FromModel: Story = {
  args: {
    model: {
      id: 'u1',
      name: 'Ada Lovelace',
      meta: '@ada',
      fallback: 'AL',
    },
  },
};
