import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Field } from './Field';
import { Inline } from './Inline';
import { Slider } from './Slider';

test('Slider puts accessible name on the thumb role=slider', () => {
  render(
    <SilkProvider>
      <Slider defaultValue={[3]} aria-label="Digest frequency" />
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Digest frequency' });
  expect(thumb.tagName).toBe('SPAN');
  expect(thumb.getAttribute('aria-label')).toBe('Digest frequency');
});

test('Slider Field wiring lands on the thumb', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[50]} />
        <Field.Description>Loudness</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Volume' });
  const label = screen.getByText('Volume');
  expect(label.getAttribute('for')).toBeNull();
  expect(thumb.getAttribute('id')).toBeNull();
  expect(thumb.getAttribute('aria-labelledby')).toBe(label.id);
  expect(document.getElementById(label.id)).toBe(label);
  const describedBy = thumb.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toBe('Loudness');
});

test('multi-thumb Slider omits Label htmlFor and thumb ids', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Price range</Field.Label>
        <Slider defaultValue={[20, 80]} />
      </Field.Root>
    </SilkProvider>,
  );
  const label = screen.getByText('Price range');
  expect(label.getAttribute('for')).toBeNull();
  const thumbs = screen.getAllByRole('slider', { name: 'Price range' });
  expect(thumbs).toHaveLength(2);
  for (const thumb of thumbs) {
    expect(thumb.getAttribute('id')).toBeNull();
    expect(thumb.getAttribute('aria-labelledby')).toBe(label.id);
  }
});

test('explicit Slider id is kept; Label still omits htmlFor', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Volume</Field.Label>
        <Slider id="volume" defaultValue={[50]} />
      </Field.Root>
    </SilkProvider>,
  );
  const label = screen.getByText('Volume');
  const thumb = screen.getByRole('slider', { name: 'Volume' });
  expect(label.getAttribute('for')).toBeNull();
  expect(thumb.getAttribute('id')).toBe('volume');
});

test('Slider in a label-less Field keeps its aria-label', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Slider defaultValue={[50]} aria-label="Volume" />
        <Field.Description>Loudness</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Volume' });
  expect(thumb.getAttribute('aria-label')).toBe('Volume');
  expect(thumb.getAttribute('aria-labelledby')).toBeNull();
});

test('multi-thumb Slider falls back to indexed aria-label', () => {
  render(
    <SilkProvider>
      <Slider defaultValue={[20, 80]} aria-label="Price" />
    </SilkProvider>,
  );
  expect(
    screen.getByRole('slider', { name: 'Price (1)' }).getAttribute(
      'aria-label',
    ),
  ).toBe('Price (1)');
  expect(
    screen.getByRole('slider', { name: 'Price (2)' }).getAttribute(
      'aria-label',
    ),
  ).toBe('Price (2)');
});

test('multi-thumb Slider without thumbLabels uses Field label', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Price range</Field.Label>
        <Slider defaultValue={[20, 80]} />
        <Field.Description>USD</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const thumbs = screen.getAllByRole('slider', { name: 'Price range' });
  expect(thumbs).toHaveLength(2);
  for (const thumb of thumbs) {
    const describedBy = thumb.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('USD');
  }
});

test('thumbLabels win over Field labelledBy', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Price range</Field.Label>
        <Slider
          defaultValue={[20, 80]}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </Field.Root>
    </SilkProvider>,
  );
  const min = screen.getByRole('slider', { name: 'Minimum price' });
  const max = screen.getByRole('slider', { name: 'Maximum price' });
  expect(min.getAttribute('aria-labelledby')).toBeNull();
  expect(max.getAttribute('aria-labelledby')).toBeNull();
});

test('single-thumb thumbLabels win over Field labelledBy', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[50]} thumbLabels={['Master volume']} />
      </Field.Root>
    </SilkProvider>,
  );
  const thumb = screen.getByRole('slider', { name: 'Master volume' });
  expect(thumb.getAttribute('aria-labelledby')).toBeNull();
  expect(thumb.getAttribute('aria-label')).toBe('Master volume');
});

test('Slider Field wiring finds Label nested in layout wrappers', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Inline gap="2" align="center" justify="between">
          <Field.Label>Volume</Field.Label>
          <Slider defaultValue={[50]} />
        </Inline>
        <Field.Description>Loudness</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const label = screen.getByText('Volume');
  const thumb = screen.getByRole('slider', { name: 'Volume' });
  expect(label.getAttribute('for')).toBeNull();
  expect(thumb.getAttribute('aria-labelledby')).toBe(label.id);
  const describedBy = thumb.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toBe('Loudness');
});

test('Field.Root required shows indicator but Slider has no aria-required', () => {
  // Range / role=slider always has a value; required is Field presentation only.
  render(
    <SilkProvider>
      <Field.Root required>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[50]} />
      </Field.Root>
    </SilkProvider>,
  );
  expect(document.querySelector('[data-required-indicator]')).not.toBeNull();
  const thumb = screen.getByRole('slider', { name: 'Volume' });
  expect(thumb.getAttribute('aria-required')).toBeNull();
  expect(thumb.hasAttribute('required')).toBe(false);
});
