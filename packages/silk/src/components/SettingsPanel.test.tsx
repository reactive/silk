import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { Field } from './Field';
import { Input } from './Input';
import { SettingsPanel } from './SettingsPanel';

test('SettingsPanel composes sections and rows', () => {
  render(
    <SettingsPanel.Root>
      <SettingsPanel.Section>
        <SettingsPanel.SectionTitle>Account</SettingsPanel.SectionTitle>
        <SettingsPanel.Row label="Name">
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input defaultValue="Ada" />
          </Field.Root>
        </SettingsPanel.Row>
      </SettingsPanel.Section>
    </SettingsPanel.Root>,
  );
  expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
  expect(screen.getByDisplayValue('Ada')).toBeTruthy();
});

test('SettingsPanel has no axe violations', async () => {
  const { container } = render(
    <SettingsPanel.Root>
      <SettingsPanel.Section>
        <SettingsPanel.SectionTitle>Account</SettingsPanel.SectionTitle>
      </SettingsPanel.Section>
    </SettingsPanel.Root>,
  );
  await expectNoAxeViolations(container);
});
