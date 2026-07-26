import { defaultTypography } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { StatGroup } from './StatGroup';

const gapBySize = { sm: '4', md: '6', lg: '7' } as const;
const valueRoleBySize = {
  sm: 'headingSm',
  md: 'heading',
  lg: 'headingLg',
} as const;

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

test('StatGroup value role and gap track size', () => {
  for (const size of ['sm', 'md', 'lg'] as const) {
    const { unmount } = render(
      <StatGroup
        size={size}
        stats={[{ id: 'a', label: 'Likes', value: 10 }]}
      />,
    );
    const root = document.querySelector('dl');
    expect(root?.getAttribute('data-size')).toBe(size);
    expect(root?.getAttribute('data-gap')).toBe(gapBySize[size]);

    const label = screen.getByText('Likes');
    const value = screen.getByText('10');
    expect(label.getAttribute('data-role')).toBe('caption');
    expect(value.getAttribute('data-role')).toBe(valueRoleBySize[size]);

    const labelRole = label.getAttribute('data-role')!;
    const valueRole = value.getAttribute('data-role')!;
    expect(defaultTypography[valueRole].size).toBeGreaterThan(
      defaultTypography[labelRole].size,
    );
    unmount();
  }
});

test('StatGroup has no axe violations', async () => {
  const { container } = render(
    <StatGroup stats={[{ id: 'a', label: 'A', value: 1 }]} />,
  );
  await expectNoAxeViolations(container);
});
