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

test('PostCard has no axe violations', async () => {
  const { container } = render(<PostCard model={model} />);
  await expectNoAxeViolations(container);
});
