import { Button, Toast } from '@reactive/silk';
import { useState, type JSX } from 'react';

export function ToastStory(): JSX.Element {
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
