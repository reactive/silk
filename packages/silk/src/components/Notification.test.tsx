import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { Notification } from './Notification';

const model = {
  id: 'n1',
  kind: 'mention' as const,
  actor: { id: 'u1', name: 'Ada', fallback: 'A' },
  text: 'mentioned you',
  createdAt: '2026-07-26T10:00:00.000Z',
  read: false,
};

test('Notification unread exposes data-read and status indicator', () => {
  const { container } = render(<Notification model={model} />);
  expect(container.querySelector('[data-read="false"]')).not.toBeNull();
  expect(screen.getByLabelText('Unread')).toBeTruthy();
  expect(screen.getByText('mentioned you')).toBeTruthy();
});

test('Notification has no axe violations', async () => {
  const { container } = render(<Notification model={model} />);
  await expectNoAxeViolations(container);
});
