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

test('EmptyState.Root centers its own element rather than a wrapper', () => {
  const { container } = render(
    <EmptyState.Root data-testid="root">
      <EmptyState.Title>Nothing here</EmptyState.Title>
    </EmptyState.Root>,
  );

  const root = screen.getByTestId('root');
  expect(container.firstElementChild).toBe(root);
  expect(root.getAttribute('data-align')).toBe('center');
  expect(root.getAttribute('data-justify')).toBe('center');
  expect(root.getAttribute('data-gap')).toBe('3');
});

test('EmptyState.Root asChild renders the consumer element as the root', () => {
  let rootRef: HTMLDivElement | null = null;
  const { container } = render(
    <EmptyState.Root
      asChild
      size="lg"
      className="consumer-root"
      data-testid="root"
      ref={(node) => {
        rootRef = node;
      }}
    >
      <section>
        <EmptyState.Title>Nothing here</EmptyState.Title>
      </section>
    </EmptyState.Root>,
  );

  const root = screen.getByTestId('root');
  expect(root.tagName).toBe('SECTION');
  expect(container.firstElementChild).toBe(root);
  expect(container.querySelector('div')).toBe(null);
  expect(root.className).toContain('consumer-root');
  expect(root.getAttribute('data-size')).toBe('lg');
  expect(root.getAttribute('data-gap')).toBe('4');
  expect(rootRef).toBe(root);
});

test('EmptyState has no axe violations', async () => {
  const { container } = render(<EmptyState title="Empty" />);
  await expectNoAxeViolations(container);
});
