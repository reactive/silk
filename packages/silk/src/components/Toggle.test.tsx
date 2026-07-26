import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';
import { ToggleGroup } from './ToggleGroup';

test('toggle pressed state', async () => {
  const user = userEvent.setup();
  render(<Toggle aria-label="Bold">B</Toggle>);
  const button = screen.getByRole('button', { name: 'Bold' });
  expect(button.getAttribute('data-state')).toBe('off');
  await user.click(button);
  expect(button.getAttribute('data-state')).toBe('on');
});

test('toggle group single selection with size inheritance', async () => {
  const user = userEvent.setup();
  render(
    <ToggleGroup.Root type="single" size="sm" aria-label="Align">
      <ToggleGroup.Item value="left" aria-label="Left">
        L
      </ToggleGroup.Item>
      <ToggleGroup.Item value="right" aria-label="Right">
        R
      </ToggleGroup.Item>
    </ToggleGroup.Root>,
  );

  const left = screen.getByRole('radio', { name: 'Left' });
  expect(left.getAttribute('data-size')).toBe('sm');
  await user.click(left);
  expect(left.getAttribute('data-state')).toBe('on');
});
