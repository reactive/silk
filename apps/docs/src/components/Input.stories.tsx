import { Input, inputRecipe, Stack } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Forms/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    ...inputRecipe.defaults,
    placeholder: 'Type here',
    'aria-label': 'Demo input',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'bad' },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="2">
      {inputRecipe.variants.size.map((size) => (
        <Input key={size} size={size} aria-label={size} placeholder={size} />
      ))}
    </Stack>
  ),
};
