import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Field } from './Field';
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
  const describedBy = thumb.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toBe('Loudness');
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
