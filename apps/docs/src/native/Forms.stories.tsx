import {
  checkboxRecipe,
  inputRecipe,
  radioGroupRecipe,
  switchRecipe,
} from '@reactive/silk-core';
import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Switch,
  Text,
  Textarea,
} from '@reactive/silk-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Forms',
  decorators: [withNativeSilk],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const FieldStack: Story = {
  render: () => (
    <Field.Root>
      <Field.Label>Display name</Field.Label>
      <Input placeholder="Ada Lovelace" />
      <Field.Description>Shown on your profile.</Field.Description>
    </Field.Root>
  ),
};

export const FieldInvalid: Story = {
  render: () => (
    <Field.Root invalid required>
      <Field.Label>Email</Field.Label>
      <Input placeholder="you@example.com" />
      <Field.Error>Enter a valid email.</Field.Error>
    </Field.Root>
  ),
};

export const TextareaDefault: Story = {
  render: () => (
    <Field.Root>
      <Field.Label>Bio</Field.Label>
      <Textarea placeholder="A short bio…" />
    </Field.Root>
  ),
};

export const CheckboxTriState: Story = {
  render: () => (
    <>
      <Checkbox accessibilityLabel="Unchecked" style={{ marginBottom: 8 }} />
      <Checkbox
        defaultChecked
        accessibilityLabel="Checked"
        style={{ marginBottom: 8 }}
      />
      <Checkbox
        checked="indeterminate"
        accessibilityLabel="Indeterminate"
        tone={checkboxRecipe.defaults.tone}
      />
    </>
  ),
};

export const SwitchSizes: Story = {
  render: () => (
    <>
      {switchRecipe.variants.size.map((size) => (
        <Switch
          key={size}
          size={size}
          accessibilityLabel={`Switch ${size}`}
          style={{ marginBottom: 12 }}
        />
      ))}
    </>
  ),
};

export const RadioGroupOrientations: Story = {
  render: () => (
    <>
      {radioGroupRecipe.variants.orientation.map((orientation) => (
        <Field.Root key={orientation} mode="group" style={{ marginBottom: 16 }}>
          <Field.Label>{orientation}</Field.Label>
          <RadioGroup.Root orientation={orientation} defaultValue="a">
            <RadioGroup.Item value="a">Option A</RadioGroup.Item>
            <RadioGroup.Item value="b">Option B</RadioGroup.Item>
          </RadioGroup.Root>
        </Field.Root>
      ))}
      <Text role="caption" tone="secondary">
        Input sizes: {inputRecipe.variants.size.join(', ')}
      </Text>
    </>
  ),
};
