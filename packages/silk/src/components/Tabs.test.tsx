import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../test/a11y';
import { Tabs } from './Tabs';

test('tabs switch panels and expose active state', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <Tabs.Root defaultValue="one">
      <Tabs.List>
        <Tabs.Trigger value="one">One</Tabs.Trigger>
        <Tabs.Trigger value="two">Two</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">Panel one</Tabs.Content>
      <Tabs.Content value="two">Panel two</Tabs.Content>
    </Tabs.Root>,
  );

  expect(screen.getByText('Panel one')).toBeTruthy();
  await user.click(screen.getByRole('tab', { name: 'Two' }));
  expect(screen.getByText('Panel two')).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('data-state')).toBe(
    'active',
  );
  await expectNoAxeViolations(container);
});

test('line and enclosed variants set data-variant', () => {
  const { rerender } = render(
    <Tabs.Root defaultValue="a" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="a">A</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">A</Tabs.Content>
    </Tabs.Root>,
  );
  expect(screen.getByRole('tablist').getAttribute('data-variant')).toBe('line');

  rerender(
    <Tabs.Root defaultValue="a" variant="enclosed">
      <Tabs.List>
        <Tabs.Trigger value="a">A</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">A</Tabs.Content>
    </Tabs.Root>,
  );
  expect(screen.getByRole('tablist').getAttribute('data-variant')).toBe(
    'enclosed',
  );
});
