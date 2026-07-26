import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Field } from './Field';
import { Select } from './Select';

test('select defaults to popper and reconstitutes theme', () => {
  render(
    <ThemeProvider colorScheme="dark">
      <Select.Root open defaultValue="a">
        <Select.Trigger aria-label="Fruit">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">Apple</Select.Item>
          <Select.Item value="b">Banana</Select.Item>
        </Select.Content>
      </Select.Root>
    </ThemeProvider>,
  );

  const listbox = screen.getByRole('listbox');
  expect(listbox.closest('[data-theme="dark"]')).not.toBeNull();
  expect(document.querySelector('[data-side]')).not.toBeNull();
});

test('select integrates with Field accessible name', () => {
  render(
    <Field.Root>
      <Field.Label>Country</Field.Label>
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="us">US</Select.Item>
        </Select.Content>
      </Select.Root>
    </Field.Root>,
  );

  expect(screen.getByRole('combobox', { name: 'Country' })).toBeTruthy();
});
