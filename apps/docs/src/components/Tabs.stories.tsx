import { Tabs, Text, tabsRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Tabs',
  component: Tabs.Root,
  argTypes: {
    variant: {
      control: 'select',
      options: [...tabsRecipe.variants.variant],
    },
  },
  args: {
    variant: tabsRecipe.defaults.variant,
  },
} satisfies Meta<typeof Tabs.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: ({ variant = tabsRecipe.defaults.variant }): JSX.Element => (
    <Tabs.Root defaultValue="account" variant={variant}>
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="password">Password</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">
        <Text>Account settings</Text>
      </Tabs.Content>
      <Tabs.Content value="password">
        <Text>Password settings</Text>
      </Tabs.Content>
    </Tabs.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Account settings')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Password' }));
    await expect(canvas.getByText('Password settings')).toBeInTheDocument();
  },
};
