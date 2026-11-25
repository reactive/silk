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

/** A drag carries the thumb, and a release past halfway turns the switch; a short one doesn't. */
export const SwitchDrag: Story = {
  // The drag moves by layout, which jsdom doesn't have; the browser run drags.
  tags: ['needs-layout'],
  render: () => <Switch testID="drag" accessibilityLabel="Drag me" />,
  play: async ({ canvas }) => {
    /**
     * A mouse pressed at `from` (a share of the track's width), moved past the
     * touch slop toward `by`, then `by` (a share of the width) further, and
     * held still before it lets go. It stays on the track: a synthetic pointer
     * can't be captured, so Gesture Handler drops its moves outside.
     */
    const across = async (from: number, by: number) => {
      const track = canvas.getByTestId('drag');
      const { left, width, top, height } = track.getBoundingClientRect();
      const at = (x: number) => ({ ...MOUSE, clientX: x, clientY: top + height / 2 });
      const start = left + width * from;
      // The pan starts here, and the thumb follows from here on.
      const caught = start + Math.sign(by) * 10;
      // A frame between moves: the pan starts a frame after the move that passes the slop.
      const frame = () => new Promise((resolve) => setTimeout(resolve, 16));
      fireEvent.pointerDown(track, { ...at(start), buttons: 1 });
      fireEvent.pointerMove(track, { ...at(caught), buttons: 1 });
      await frame();
      fireEvent.pointerMove(track, { ...at(caught + width * by), buttons: 1 });
      // Still for longer than a fling allows, so the release lands by where the thumb is.
      await new Promise((resolve) => setTimeout(resolve, 100));
      fireEvent.pointerUp(track, { ...at(caught + width * by), buttons: 0 });
    };
    const sw = canvas.getByRole('switch', { name: 'Drag me' });
    // Dragged until it shows: under the test runner, the story's first drags
    // can come before the switch takes them.
    await waitFor(async () => {
      await across(0.1, 0.6);
      expect(sw).toHaveAttribute('aria-checked', 'true');
    });
    // A short drag back leaves it on; a long one turns it off.
    await across(0.9, -0.1);
    // Long enough for a wrong report to render.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await across(0.9, -0.6);
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'false'));
  },
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

const PADDED = [
  { name: 'Padded', vertical: false, rtl: false },
  { name: 'Padded, right to left', vertical: false, rtl: true },
  { name: 'Padded, vertical', vertical: true, rtl: false },
] as const;

/**
 * Presses on a slider with padding and a border bring the thumb to the
 * press, and a drag slides it: the slide runs along the box its thumbs sit
 * in, inside both.
 */
export const SliderPadded: Story = {
  // Presses land by layout, which jsdom doesn't have; the browser run presses.
  tags: ['needs-layout'],
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24 }}>
      {PADDED.map(({ name, vertical, rtl }) => (
        // A horizontal slider fills its container's width, as in an app.
        <View key={name} style={vertical ? undefined : { width: 240 }}>
          <Slider
            testID={name}
            accessibilityLabel={name}
            defaultValue={[50]}
            orientation={vertical ? 'vertical' : 'horizontal'}
            dir={rtl ? 'rtl' : 'ltr'}
            style={[INSET, vertical ? { height: 240 } : undefined]}
          />
        </View>
      ))}
    </View>
  ),
  play: async ({ canvas }) => {
    for (const row of PADDED) {
      for (const value of [0, 50, 100]) {
        // Pressed until it shows: under the test runner, the story's first
        // presses can come before the slider takes them. A press that lands
        // off the thumb's point never shows, so this still fails.
        await waitFor(() => {
          const slider = canvas.getByTestId(row.name);
          const thumb = canvas.getByRole('slider', { name: row.name });
          const point = pressPoint(slider, thumb, value, row);
          press(slider, point);
          expect(thumb).toHaveAttribute('aria-valuenow', String(value));
        });
      }
      // A drag slides the thumb from where it went down, past the slider's end.
      await waitFor(() => {
        const slider = canvas.getByTestId(row.name);
        const thumb = canvas.getByRole('slider', { name: row.name });
        drag(slider, [
          pressPoint(slider, thumb, 10, row),
          pressPoint(slider, thumb, 40, row),
          pressPoint(slider, thumb, 100, row, 20),
        ]);
        expect(thumb).toHaveAttribute('aria-valuenow', '100');
      });
    }
  },
};

type Point = { clientX: number; clientY: number };

/** The primary mouse button, as the stories' synthetic pointers press it. */
const MOUSE = { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 };

/** A mouse press at `point` on `target`, let go where it went down, as Gesture Handler hears one. */
function press(target: HTMLElement, point: Point) {
  drag(target, [point]);
}

/** A mouse pressed at the first point on `target`, moved through the rest, and let go at the last. */
function drag(target: HTMLElement, [first, ...rest]: readonly Point[]) {
  fireEvent.pointerDown(target, { ...MOUSE, ...first, buttons: 1 });
  for (const point of rest) fireEvent.pointerMove(target, { ...MOUSE, ...point, buttons: 1 });
  fireEvent.pointerUp(target, { ...MOUSE, ...(rest.at(-1) ?? first), buttons: 0 });
}

/**
 * Where on the page a thumb's center sits at `value` (of 0 to 100) on a
 * padded slider, and `beyond` pixels further toward max. Mirrors
 * `slideFrom` for sliders that aren't inverted.
 */
function pressPoint(
  slider: HTMLElement,
  thumb: HTMLElement,
  value: number,
  { vertical, rtl }: (typeof PADDED)[number],
  beyond = 0,
): Point {
  const box = slider.getBoundingClientRect();
  const thumbSize = thumb.getBoundingClientRect().width;
  const edge = INSET.padding + INSET.borderWidth;
  const travel = (vertical ? box.height : box.width) - 2 * edge - thumbSize;
  // From the end `min` sits at: the bottom, or the right when right to left.
  const fromMin = edge + thumbSize / 2 + (value / 100) * travel + beyond;
  return vertical
    ? { clientX: box.left + box.width / 2, clientY: box.bottom - fromMin }
    : {
        clientX: rtl ? box.right - fromMin : box.left + fromMin,
        clientY: box.top + box.height / 2,
      };
}

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
