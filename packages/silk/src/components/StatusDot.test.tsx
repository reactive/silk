import { expect, test } from '@rstest/core';
import { render } from '@testing-library/react';
import { StatusDot } from './StatusDot';

test('StatusDot is aria-hidden by default', () => {
  const { container } = render(<StatusDot />);
  const dot = container.querySelector('[data-tone="accent"]');
  expect(dot?.getAttribute('aria-hidden')).toBe('true');
});
