import {
  Checkbox,
  Field,
  Inline,
  Input,
  RadioGroup,
  Stack,
  Switch,
  Textarea,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { expect } from 'storybook/test';

const meta = {
  title: 'Components/Forms/Field',
  component: Field.Root,
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
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/Email/);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby');
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      /valid email address/i,
    );
  },
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
      <Field.Root controlId="subscribe" orientation="horizontal">
        <Checkbox defaultChecked />
        <Field.Label>Subscribe</Field.Label>
        <Field.Description>Weekly digest of new activity.</Field.Description>
      </Field.Root>
      {/* Settings rows push the control to the far edge — a layout choice the
          field itself does not own. */}
      <Field.Root>
        <Inline gap="2" align="center" justify="between">
          <Field.Label>Airplane mode</Field.Label>
          <Switch />
        </Inline>
      </Field.Root>
    </Stack>
  ),
};
