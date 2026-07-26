import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { ProfileCard } from './ProfileCard';

const model = {
  identity: { id: 'u1', name: 'Ada Lovelace', fallback: 'AL' },
  bio: 'Mathematician',
  stats: [{ id: 'followers', label: 'Followers', value: 10 }],
  actions: [{ id: 'follow', label: 'Follow' }],
};

test('ProfileCard renders identity bio and action', () => {
  render(<ProfileCard model={model} />);
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('Mathematician')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
});

test('ProfileCard horizontal layout places header beside body', () => {
  const { container } = render(
    <ProfileCard model={model} layout="horizontal" />,
  );
  expect(container.querySelector('[data-layout="horizontal"]')).not.toBeNull();
  const header = container.querySelector('header');
  expect(header).not.toBeNull();
  expect(header?.parentElement?.getAttribute('data-direction')).toBe('row');
});

test('ProfileCard has no axe violations', async () => {
  const { container } = render(<ProfileCard model={model} />);
  await expectNoAxeViolations(container);
});
