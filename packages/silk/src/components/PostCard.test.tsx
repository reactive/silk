import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { PostCard } from './PostCard';

const model = {
  id: 'p1',
  author: { id: 'u1', name: 'Ada', fallback: 'A' },
  body: 'Hello world',
  createdAt: '2026-07-26T10:00:00.000Z',
  actions: [{ id: 'like', label: 'Like' }],
} as const;

test('PostCard renders article with author and body', () => {
  render(<PostCard model={model} />);
  expect(screen.getByRole('article')).toBeTruthy();
  expect(screen.getByText('Ada')).toBeTruthy();
  expect(screen.getByText('Hello world')).toBeTruthy();
  expect(document.querySelector('time')?.getAttribute('dateTime')).toBe(
    model.createdAt,
  );
});

test('PostCard.Root asChild renders the consumer element as the root', () => {
  const { container } = render(
    <ul>
      <PostCard.Root asChild data-testid="root">
        <li>Body</li>
      </PostCard.Root>
    </ul>,
  );

  const root = screen.getByTestId('root');
  expect(root.tagName).toBe('LI');
  expect(root.parentElement).toBe(container.querySelector('ul'));
  expect(container.querySelector('article')).toBe(null);
  expect(root.getAttribute('data-density')).toBe('comfortable');
  expect(root.textContent).toBe('Body');
});

test('PostCard has no axe violations', async () => {
  const { container } = render(<PostCard model={model} />);
  await expectNoAxeViolations(container);
});
