import {
  Field,
  Input,
  SettingsPanel,
  Switch,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/SettingsPanel',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: () => (
    <SettingsPanel.Root>
      <SettingsPanel.Section>
        <SettingsPanel.SectionTitle>Account</SettingsPanel.SectionTitle>
        <SettingsPanel.Row label="Display name">
          <Field.Root>
            <Field.Label>Display name</Field.Label>
            <Input defaultValue="Ada Lovelace" />
          </Field.Root>
        </SettingsPanel.Row>
        <SettingsPanel.Row label="Email notifications">
          <Switch aria-label="Email notifications" defaultChecked />
        </SettingsPanel.Row>
      </SettingsPanel.Section>
    </SettingsPanel.Root>
  ),
};
