import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../test/a11y';
import { ActionBar } from './ActionBar';

test('ActionBar exposes toolbar name and actions', async () => {
  const user = userEvent.setup();
  let clicked = '';
  render(
    <ActionBar.Root aria-label="Post actions">
      <ActionBar.Action
        onClick={() => {
          clicked = 'like';
        }}
      >
        Like
      </ActionBar.Action>
      <ActionBar.Action>Reply</ActionBar.Action>
    </ActionBar.Root>,
  );
  expect(screen.getByRole('toolbar', { name: 'Post actions' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Like' }));
  expect(clicked).toBe('like');
});

test('ActionBar compact density reaches actions', () => {
  const { container } = render(
    <ActionBar.Root aria-label="Actions" density="compact">
      <ActionBar.Action>One</ActionBar.Action>
    </ActionBar.Root>,
  );
  expect(container.querySelector('[data-density="compact"]')).not.toBeNull();
  expect(
    container.querySelector('button[data-density="compact"]'),
  ).not.toBeNull();
});

test('ActionBar has no axe violations', async () => {
  const { container } = render(
    <ActionBar.Root aria-label="Actions">
      <ActionBar.Action>One</ActionBar.Action>
    </ActionBar.Root>,
  );
  await expectNoAxeViolations(container);
});
