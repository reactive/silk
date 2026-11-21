import {
  checkboxRecipe,
  inputRecipe,
  radioGroupRecipe,
  sliderRecipe,
  switchRecipe,
} from '@reactive/silk-core';
import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Slider,
  Switch,
  Text,
  Textarea,
  useSliderMarkStyle,
  useTheme,
} from '@reactive/silk-native';
import { View } from 'react-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { expect, fireEvent, waitFor } from 'storybook/test';
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

export const SliderSizes: Story = {
  render: () => (
    <>
      {sliderRecipe.variants.size.map((size) => (
        <Field.Root key={size} style={{ marginBottom: 16 }}>
          <Field.Label>Volume ({size})</Field.Label>
          <Slider size={size} defaultValue={[40]} />
        </Field.Root>
      ))}
      <Field.Root>
        <Field.Label>Price range</Field.Label>
        <Slider
          defaultValue={[20, 80]}
          step={5}
          minStepsBetweenThumbs={2}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </Field.Root>
    </>
  ),
};

const TICK = 6;

/** A dot under the thumb's center at `value`: a Slider child placed by `useSliderMarkStyle`. */
function Tick({ value }: { readonly value: number }) {
  const markStyle = useSliderMarkStyle();
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: TICK,
          height: TICK,
          borderRadius: TICK / 2,
          backgroundColor: theme.semantic.color.tones.neutral.border,
        },
        markStyle(value, -TICK / 2),
      ]}
    />
  );
}

const STOPS = [0, 1, 2, 3, 4];

export const SliderMarks: Story = {
  render: () => (
    <>
      <Field.Root style={{ marginBottom: 16 }}>
        <Field.Label>Strength (five stops)</Field.Label>
        <Slider min={0} max={4} defaultValue={[1]}>
          {STOPS.map((stop) => (
            <Tick key={stop} value={stop} />
          ))}
        </Slider>
      </Field.Root>
      <Field.Root style={{ marginBottom: 16 }}>
        <Field.Label>Right to left</Field.Label>
        <Slider min={0} max={4} defaultValue={[1]} dir="rtl">
          {STOPS.map((stop) => (
            <Tick key={stop} value={stop} />
          ))}
        </Slider>
      </Field.Root>
      <Field.Root>
        <Field.Label>Vertical, inverted</Field.Label>
        <Slider min={0} max={4} defaultValue={[1]} orientation="vertical" inverted>
          {STOPS.map((stop) => (
            <Tick key={stop} value={stop} />
          ))}
        </Slider>
      </Field.Root>
    </>
  ),
};

const INSET = { padding: 24, borderWidth: 4, borderColor: 'transparent' } as const;

/**
 * Presses on a slider with padding and a border bring the thumb to the
 * press: the slide runs along the box its thumbs sit in, inside both.
 */
export const SliderPadded: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24 }}>
      <View style={{ width: 320 }}>
        <Slider testID="Padded" accessibilityLabel="Padded" defaultValue={[50]} style={INSET} />
      </View>
      <Slider
        testID="Padded, vertical"
        accessibilityLabel="Padded, vertical"
        defaultValue={[50]}
        orientation="vertical"
        style={[INSET, { height: 240 }]}
      />
    </View>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Padded', 'Padded, vertical']) {
      const thumb = canvas.getByRole('slider', { name });
      const slider = canvas.getByTestId(name);
      const vertical = name.endsWith('vertical');
      const box = slider.getBoundingClientRect();
      const size = thumb.getBoundingClientRect().width;
      const inset = INSET.padding + INSET.borderWidth;
      const travel = (vertical ? box.height : box.width) - 2 * inset - size;
      // Where the thumb's center sits at 0, 50 and 100: half a thumb in from each end.
      for (const value of [0, 50, 100]) {
        const along = inset + size / 2 + (value / 100) * travel;
        const coords = vertical
          ? { clientX: box.left + box.width / 2, clientY: box.bottom - along }
          : { clientX: box.left + along, clientY: box.top + box.height / 2 };
        // Pressed again until it shows: the press renders a tick later, and the
        // story's first presses can come before react-native-web listens for them.
        await waitFor(() => {
          fireEvent.mouseDown(slider, { ...coords, button: 0, buttons: 1 });
          fireEvent.mouseUp(document, { ...coords, button: 0, buttons: 0 });
          expect(thumb).toHaveAttribute('aria-valuenow', String(value));
        });
      }
    }
  },
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
