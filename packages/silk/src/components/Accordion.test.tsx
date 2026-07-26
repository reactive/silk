import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

test('single accordion expands and collapses', async () => {
  const user = userEvent.setup();
  render(
    <Accordion.Root type="single" collapsible>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>Section A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Body A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Header>
          <Accordion.Trigger>Section B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Body B</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>,
  );

  expect(screen.queryByText('Body A')).toBeNull();
  await user.click(screen.getByRole('button', { name: /Section A/ }));
  expect(screen.getByText('Body A')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /Section A/ }));
  expect(screen.queryByText('Body A')).toBeNull();
});
