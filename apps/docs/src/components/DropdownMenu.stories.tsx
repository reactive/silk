import { Button, DropdownMenu } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/DropdownMenu',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>Actions</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>File</DropdownMenu.Label>
        <DropdownMenu.Item shortcut="⌘N">New</DropdownMenu.Item>
        <DropdownMenu.Item shortcut="⌘O">Open</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item tone="danger" shortcut="⌘⌫">
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    await expect(
      await screen.findByRole('menuitem', { name: /New/ }),
    ).toBeInTheDocument();
  },
};

export const CheckboxAndRadio: Story = {
  render: (): JSX.Element => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">View</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.CheckboxItem checked>
          <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>
          Show toolbar
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.Separator />
        <DropdownMenu.RadioGroup value="comfortable">
          <DropdownMenu.RadioItem value="compact">
            <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
            Compact
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="comfortable">
            <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
            Comfortable
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  ),
};
