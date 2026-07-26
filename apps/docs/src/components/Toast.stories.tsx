import { Button, Toast } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState, type JSX } from 'react';

const meta = {
  title: 'Components/Interaction/Toast',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastStory(): JSX.Element {
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
}

export const Basic: Story = {
  render: (): JSX.Element => <ToastStory />,
};
