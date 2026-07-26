import { Field, Select, Stack, selectRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Select',
  argTypes: {
    size: {
      control: 'select',
      options: [...selectRecipe.variants.size],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <Field.Root>
      <Field.Label>Fruit</Field.Label>
      <Select.Root defaultValue="apple">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="cherry">Cherry</Select.Item>
        </Select.Content>
      </Select.Root>
    </Field.Root>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    await expect(
      await screen.findByRole('option', { name: 'Banana' }),
    ).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  tags: ['!test'],
  render: (): JSX.Element => (
    <Stack gap="3">
      {selectRecipe.variants.size.map((size) => (
        <Select.Root key={size} size={size} defaultValue="a">
          <Select.Trigger aria-label={`Size ${size}`}>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="a">{size}</Select.Item>
            <Select.Item value="b">Other</Select.Item>
          </Select.Content>
        </Select.Root>
      ))}
    </Stack>
  ),
};
