import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { StatGroup } from './StatGroup';

test('StatGroup renders definition list with delta', () => {
  render(
    <StatGroup
      stats={[
        {
          id: 'likes',
          label: 'Likes',
          value: 10,
          delta: { value: 2, direction: 'up' },
        },
      ]}
    />,
  );
  expect(screen.getByText('Likes')).toBeTruthy();
  expect(screen.getByText('10')).toBeTruthy();
  expect(screen.getByLabelText('up 2')).toBeTruthy();
  expect(document.querySelector('dl')).not.toBeNull();
  expect(document.querySelector('dt')).not.toBeNull();
  expect(document.querySelector('dd')).not.toBeNull();
});

test('StatGroup has no axe violations', async () => {
  const { container } = render(
    <StatGroup stats={[{ id: 'a', label: 'A', value: 1 }]} />,
  );
  await expectNoAxeViolations(container);
});
