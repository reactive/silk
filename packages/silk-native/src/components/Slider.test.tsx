import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type JSX } from 'react';
import { sliderMarkStyle } from '../styles/mappers/controls.js';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Field } from './Field.js';
import {
  fractionAt,
  moveThumb,
  nearestThumb,
  Slider,
  type SliderProps,
} from './Slider.js';

function Controlled(props: Omit<SliderProps, 'value' | 'onValueChange'> & { initial: number[] }): JSX.Element {
  const { initial, ...rest } = props;
  const [value, setValue] = useState(initial);
  return (
    <SilkProvider>
      <Slider {...rest} value={value} onValueChange={setValue} />
    </SilkProvider>
  );
}

const now = (thumb: HTMLElement) => Number(thumb.getAttribute('aria-valuenow'));

test('a thumb is a slider with its value, bounds and spoken value', () => {
  render(
    <SilkProvider>
      <Slider
        accessibilityLabel="Strength"
        min={1}
        max={5}
        defaultValue={[2]}
        thumbValueText={['1500, Club']}
      />
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Strength' });
  expect(thumb.getAttribute('aria-valuemin')).toBe('1');
  expect(thumb.getAttribute('aria-valuemax')).toBe('5');
  expect(now(thumb)).toBe(2);
  expect(thumb.getAttribute('aria-valuetext')).toBe('1500, Club');
  expect(thumb.getAttribute('aria-orientation')).toBe('horizontal');
  expect(thumb.getAttribute('tabindex')).toBe('0');
});

test('arrow keys step, Shift and Page keys step ten, Home and End go to the bounds', () => {
  const commits: number[][] = [];
  render(<Controlled accessibilityLabel="Volume" initial={[50]} step={2} onValueCommit={(v) => commits.push(v)} />);
  const thumb = screen.getByRole('slider');
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  expect(now(thumb)).toBe(52);
  fireEvent.keyDown(thumb, { key: 'ArrowDown' });
  expect(now(thumb)).toBe(50);
  fireEvent.keyDown(thumb, { key: 'ArrowUp', shiftKey: true });
  expect(now(thumb)).toBe(70);
  fireEvent.keyDown(thumb, { key: 'PageDown' });
  expect(now(thumb)).toBe(50);
  fireEvent.keyDown(thumb, { key: 'End' });
  expect(now(thumb)).toBe(100);
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  expect(now(thumb)).toBe(100);
  fireEvent.keyDown(thumb, { key: 'Home' });
  expect(now(thumb)).toBe(0);
  // One commit per change; the press at the bound changed nothing.
  expect(commits).toEqual([[52], [50], [70], [50], [100], [0]]);
});

test('right to left, or inverted, ArrowRight moves toward min', () => {
  render(
    <>
      <Controlled accessibilityLabel="rtl" initial={[5]} dir="rtl" />
      <Controlled accessibilityLabel="inverted" initial={[5]} inverted />
    </>,
  );
  for (const name of ['rtl', 'inverted']) {
    const thumb = screen.getByRole('slider', { name });
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(now(thumb)).toBe(4);
    fireEvent.keyDown(thumb, { key: 'ArrowUp' });
    expect(now(thumb)).toBe(5);
  }
});

test('a vertical slider says so, and ArrowUp moves toward max', () => {
  render(<Controlled accessibilityLabel="Level" initial={[5]} orientation="vertical" />);
  const thumb = screen.getByRole('slider');
  expect(thumb.getAttribute('aria-orientation')).toBe('vertical');
  fireEvent.keyDown(thumb, { key: 'ArrowUp' });
  expect(now(thumb)).toBe(6);
});

test('thumbs of a range keep their gap, and Home and End move the outer ones', () => {
  render(
    <Controlled
      initial={[20, 30]}
      step={5}
      minStepsBetweenThumbs={1}
      thumbLabels={['From', 'To']}
    />,
  );
  const from = screen.getByRole('slider', { name: 'From' });
  const to = screen.getByRole('slider', { name: 'To' });
  fireEvent.keyDown(from, { key: 'ArrowRight' });
  expect([now(from), now(to)]).toEqual([25, 30]);
  // One step apart already: refused.
  fireEvent.keyDown(from, { key: 'ArrowRight' });
  expect([now(from), now(to)]).toEqual([25, 30]);
  fireEvent.keyDown(to, { key: 'Home' });
  expect([now(from), now(to)]).toEqual([0, 30]);
  fireEvent.keyDown(from, { key: 'End' });
  expect([now(from), now(to)]).toEqual([0, 100]);
});

test('without a gap, a thumb crossing another swaps places and keeps focus', () => {
  render(<Controlled initial={[40, 41]} thumbLabels={['Low', 'High']} />);
  const low = screen.getByRole('slider', { name: 'Low' });
  low.focus();
  fireEvent.keyDown(low, { key: 'ArrowRight', shiftKey: true });
  const [first, second] = screen.getAllByRole('slider');
  expect([now(first!), now(second!)]).toEqual([41, 50]);
  expect(document.activeElement).toBe(second);
});

test('a press on the slider prevents the mousedown default, which would take focus off the thumb (web)', () => {
  render(<Controlled accessibilityLabel="Kept" initial={[5]} testID="root" />);
  // fireEvent returns false when the default (moving focus) was prevented.
  expect(fireEvent.mouseDown(screen.getByTestId('root'))).toBe(false);
});

test('a step of 0 or less steps by 1', () => {
  render(
    <>
      <Controlled accessibilityLabel="zero" initial={[5]} step={0} />
      <Controlled accessibilityLabel="negative" initial={[5]} step={-2} />
    </>,
  );
  for (const name of ['zero', 'negative']) {
    const thumb = screen.getByRole('slider', { name });
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(now(thumb)).toBe(6);
  }
});

test('values snap to the step grid from min', () => {
  render(<Controlled accessibilityLabel="Price" initial={[0.3]} min={0.1} max={1} step={0.2} />);
  const thumb = screen.getByRole('slider');
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  expect(now(thumb)).toBe(0.5);
});

test('a disabled slider ignores keys and leaves the Tab order', () => {
  const changes: number[][] = [];
  render(
    <SilkProvider>
      <Slider accessibilityLabel="Off" defaultValue={[5]} disabled onValueChange={(v) => changes.push(v)} />
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider');
  expect(thumb.getAttribute('aria-disabled')).toBe('true');
  expect(thumb.getAttribute('tabindex')).not.toBe('0');
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  fireEvent.keyDown(thumb, { key: 'End' });
  expect(changes).toEqual([]);
  expect(now(thumb)).toBe(5);
});

test('a controlled slider whose owner turns a change down starts the next from where it shows', () => {
  const changes: number[][] = [];
  render(
    <SilkProvider>
      <Slider accessibilityLabel="Stuck" value={[50]} onValueChange={(v) => changes.push(v)} />
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider');
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  fireEvent.keyDown(thumb, { key: 'ArrowRight' });
  expect(changes).toEqual([[51], [51]]);
  expect(now(thumb)).toBe(50);
});

test('moveThumb snaps, clamps, sorts, and keeps whole steps apart despite float error', () => {
  const bounds = { min: 0, max: 1, step: 0.1, minSteps: 1 };
  expect(moveThumb([0.1, 0.3], 0.2, 0, bounds)).toEqual({ values: [0.2, 0.3], index: 0 });
  expect(moveThumb([0.2, 0.3], 0.3, 0, bounds)).toBeUndefined();
  expect(moveThumb([0.2, 0.5], 0.93, 0, bounds)).toEqual({ values: [0.5, 0.9], index: 1 });
  expect(moveThumb([0.5], 7, 0, bounds)).toEqual({ values: [1], index: 0 });
  // Rounding can give -0 (-0.9 + 3 * 0.3); it comes back as 0.
  const zero = moveThumb([0.3], 0, 0, { min: -0.9, max: 0.9, step: 0.3, minSteps: 0 });
  expect(Object.is(zero?.values[0], 0)).toBe(true);
});

test('moveThumb keeps a full step apart at an off-grid max, and snaps steps written with an exponent', () => {
  // 95 is half a step past 90: 90 and 95 are not a step apart.
  const offGrid = { min: 0, max: 95, step: 10, minSteps: 1 };
  expect(moveThumb([80, 95], 90, 0, offGrid)).toBeUndefined();
  const tiny = { min: 0, max: 0.000001, step: 0.0000001, minSteps: 0 };
  expect(moveThumb([0], 0.00000031, 0, tiny)?.values).toEqual([0.0000003]);
  // Near a million, subtracting loses more than a billionth of a step: a step still counts.
  const large = { min: 1e6, max: 1e6 + 10, step: 0.01, minSteps: 1 };
  expect(moveThumb([1000000.06, 1000001.06], 1000000.07, 1, large)?.values).toEqual([
    1000000.06, 1000000.07,
  ]);
});

test('a thumb sits by percent less a share of its size, so its center stays in bounds', () => {
  render(
    <SilkProvider>
      <Slider accessibilityLabel="Half" defaultValue={[50]} size="md" />
      <Slider accessibilityLabel="End" defaultValue={[100]} size="md" />
    </SilkProvider>,
  );
  // md thumb: 20px. Left edge at 50% - 10px puts its center at 50% (= 10 + 0.5 * (width - 20)).
  const half = screen.getByRole('slider', { name: 'Half' }).style;
  expect([half.left, half.marginLeft]).toEqual(['50%', '-10px']);
  const end = screen.getByRole('slider', { name: 'End' }).style;
  expect([end.left, end.marginLeft]).toEqual(['100%', '-20px']);
});

test('a vertical thumb sits from the bottom, an inverted one from the top', () => {
  render(
    <SilkProvider>
      <Slider accessibilityLabel="Up" orientation="vertical" defaultValue={[25]} size="md" />
      <Slider accessibilityLabel="Down" orientation="vertical" inverted defaultValue={[25]} size="md" />
    </SilkProvider>,
  );
  const up = screen.getByRole('slider', { name: 'Up' }).style;
  expect([up.bottom, up.marginBottom]).toEqual(['25%', '-5px']);
  const down = screen.getByRole('slider', { name: 'Down' }).style;
  expect([down.top, down.marginTop]).toEqual(['25%', '-5px']);
});

test('fractionAt inverts the placement: half a thumb in is min, half a thumb before the end is max', () => {
  expect(fractionAt(10, 200, 20)).toBe(0);
  expect(fractionAt(190, 200, 20)).toBe(1);
  expect(fractionAt(100, 200, 20)).toBe(0.5);
  expect(fractionAt(-50, 200, 20)).toBe(0);
  expect(fractionAt(500, 200, 20)).toBe(1);
  expect(nearestThumb([10, 20], 15)).toBe(0);
  expect(nearestThumb([10, 20], 16)).toBe(1);
});

test('sliderMarkStyle puts a mark where the thumb centers at a fraction, offset from it', () => {
  // A 20px thumb at 50%: center at 50%; an 8-wide dot centered there starts 4px before it.
  expect(sliderMarkStyle(0.5, 20, -4)).toEqual({ left: '50%', marginLeft: -4 });
  expect(sliderMarkStyle(0, 20)).toEqual({ left: '0%', marginLeft: 10 });
  expect(sliderMarkStyle(1, 20, 0, 'bottom')).toEqual({ bottom: '100%', marginBottom: -10 });
});

test('a Field names the thumb, describes it, and its label focuses it', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Field.Label>Opponent</Field.Label>
        <Slider defaultValue={[2]} max={4} />
        <Field.Description>How strong it plays</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Opponent' });
  expect(thumb.getAttribute('aria-describedby')).toBe(
    screen.getByText('How strong it plays').getAttribute('id'),
  );
  expect(thumb.getAttribute('aria-invalid')).toBe('true');
  fireEvent.click(screen.getByText('Opponent'));
  expect(document.activeElement).toBe(thumb);
});

test('children draw on the slider and take no touches', () => {
  render(
    <SilkProvider>
      <Slider accessibilityLabel="Marks" testID="root">
        <Field.Description testID="mark">mark</Field.Description>
      </Slider>
    </SilkProvider>,
  );
  const mark = screen.getByTestId('mark');
  expect(screen.getByTestId('root').contains(mark)).toBe(true);
  expect(getComputedStyle(mark.parentElement!).pointerEvents).toBe('none');
});
