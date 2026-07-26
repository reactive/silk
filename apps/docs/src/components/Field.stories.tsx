import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Stack,
  Switch,
  Textarea,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Field',
  component: Field.Root,
  tags: ['autodocs'],
} satisfies Meta<typeof Field.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InputField: Story = {
  render: () => (
    <Field.Root required>
      <Field.Label>Email</Field.Label>
      <Input type="email" placeholder="you@example.com" />
      <Field.Description>We never share your email.</Field.Description>
    </Field.Root>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Field.Root invalid required>
      <Field.Label>Email</Field.Label>
      <Input type="email" defaultValue="not-an-email" />
      <Field.Description>Work email preferred.</Field.Description>
      <Field.Error>Enter a valid email address.</Field.Error>
    </Field.Root>
  ),
};

export const GroupRadio: Story = {
  render: () => (
    <Field.Root mode="group">
      <Field.Label>Notification channel</Field.Label>
      <RadioGroup.Root defaultValue="email">
        <RadioGroup.Item value="email">Email</RadioGroup.Item>
        <RadioGroup.Item value="push">Push</RadioGroup.Item>
        <RadioGroup.Item value="none">None</RadioGroup.Item>
      </RadioGroup.Root>
    </Field.Root>
  ),
};

export const MixedControls: Story = {
  render: () => (
    <Stack gap="4">
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea rows={3} />
      </Field.Root>
      <Field.Root>
        <Checkbox defaultChecked /> <Field.Label>Subscribe</Field.Label>
      </Field.Root>
      <Field.Root>
        <Switch aria-label="Airplane mode" />
      </Field.Root>
    </Stack>
  ),
};
