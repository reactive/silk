import { Avatar, Stack, avatarRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    fallback: 'AL',
    ...avatarRecipe.defaults,
  },
  argTypes: {
    size: {
      control: 'select',
      options: [...avatarRecipe.variants.size],
    },
    shape: {
      control: 'select',
      options: [...avatarRecipe.variants.shape],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fallback: Story = {};

export const WithImage: Story = {
  args: {
    src: 'https://avatars.githubusercontent.com/u/810438?v=4',
    alt: 'Example user',
    fallback: 'EX',
  },
};

export const SizeShapeMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <VariantMatrix
      rows={avatarRecipe.variants.size}
      columns={avatarRecipe.variants.shape}
    >
      {(size, shape): JSX.Element => (
        <Avatar size={size} shape={shape} fallback={size.toUpperCase()} />
      )}
    </VariantMatrix>
  ),
};

export const AccessibleLabeling: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack direction="row" gap="3" align="center">
      <Avatar
        src="https://avatars.githubusercontent.com/u/810438?v=4"
        alt="Example user"
      />
      {/* Without `src` there is no img to carry `alt` — label the span instead. */}
      <Avatar fallback="JD" aria-label="Jane Doe" />
      <Avatar fallback="?" role="img" aria-label="Unknown user" />
    </Stack>
  ),
};
