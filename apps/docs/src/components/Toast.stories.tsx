import { Button, Toast } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState, type JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Toast',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: function BasicToast(): JSX.Element {
    const [open, setOpen] = useState(false);
    return (
      <Toast.Provider swipeDirection="right">
        <Button onClick={() => setOpen(true)}>Show toast</Button>
        <Toast.Root open={open} onOpenChange={setOpen} tone="success">
          <Toast.Title>Scheduled</Toast.Title>
          <Toast.Description>Friday at 10:00 AM</Toast.Description>
          <Toast.Action altText="Undo schedule" onClick={() => setOpen(false)}>
            Undo
          </Toast.Action>
          <Toast.Close aria-label="Close" />
        </Toast.Root>
        <Toast.Viewport />
      </Toast.Provider>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    await expect(await screen.findByText('Scheduled')).toBeInTheDocument();
  },
};
