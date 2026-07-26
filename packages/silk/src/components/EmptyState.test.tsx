import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { EmptyState } from './EmptyState';

test('EmptyState convenience renders title and description', () => {
  render(
    <EmptyState title="Nothing here" description="Try again later" />,
  );
  expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeTruthy();
  expect(screen.getByText('Try again later')).toBeTruthy();
});

test('EmptyState has no axe violations', async () => {
  const { container } = render(<EmptyState title="Empty" />);
  await expectNoAxeViolations(container);
});
