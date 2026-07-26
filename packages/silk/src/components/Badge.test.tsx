import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Badge } from './Badge';

test('Badge renders defaults and tone data attrs', () => {
  render(
    <SilkProvider>
      <Badge tone="success">Done</Badge>
    </SilkProvider>,
  );
  const el = screen.getByText('Done');
  expect(el.getAttribute('data-tone')).toBe('success');
  expect(el.getAttribute('data-variant')).toBe('soft');
});
