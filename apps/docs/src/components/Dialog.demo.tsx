import {
  Button,
  Dialog,
  Inline,
  Popover,
  Select,
  Stack,
  Text,
  Toast,
  Tooltip,
} from '@reactive/silk';
import { useState, type JSX, type ReactNode } from 'react';

export function DialogBody({
  title,
  description,
  actions,
}: {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly actions?: ReactNode;
}): JSX.Element {
  return (
    <Stack gap="3">
      <Dialog.Title asChild>
        <Text role="heading">{title}</Text>
      </Dialog.Title>
      <Dialog.Description asChild>
        <Text tone="secondary">{description}</Text>
      </Dialog.Description>
      {actions}
    </Stack>
  );
}

export const confirmActions = (
  <Inline gap="2" align="center" wrap="nowrap">
    <Dialog.Close asChild>
      <Button tone="neutral" variant="outline">
        Cancel
      </Button>
    </Dialog.Close>
    <Dialog.Close asChild>
      <Button>Confirm</Button>
    </Dialog.Close>
  </Inline>
);

export function LayeringStory(): JSX.Element {
  const [toastOpen, setToastOpen] = useState(false);

  return (
    <Toast.Provider swipeDirection="right">
      <Tooltip.Provider>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content size="md">
            <DialogBody
              title="Overlays inside a dialog"
              description="Select, Popover, Tooltip, and Toast all portal to the body as siblings of this panel, and all paint above it."
              actions={
                <Stack gap="3">
                  <Select.Root defaultValue="apple">
                    <Select.Trigger aria-label="Fruit">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="apple">Apple</Select.Item>
                      <Select.Item value="banana">Banana</Select.Item>
                    </Select.Content>
                  </Select.Root>
                  <Inline gap="2" align="center" wrap="nowrap">
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <Button variant="outline" tone="neutral">
                          Popover
                        </Button>
                      </Popover.Trigger>
                      <Popover.Content size="sm">
                        <Text>Above the dialog panel.</Text>
                      </Popover.Content>
                    </Popover.Root>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Button variant="outline" tone="neutral">
                          Tooltip
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content>Above the dialog panel</Tooltip.Content>
                    </Tooltip.Root>
                    <Button onClick={() => setToastOpen(true)}>Toast</Button>
                  </Inline>
                </Stack>
              }
            />
          </Dialog.Content>
        </Dialog.Root>
      </Tooltip.Provider>
      <Toast.Root open={toastOpen} onOpenChange={setToastOpen} tone="success">
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Toasts stay above the modal layer.</Toast.Description>
        <Toast.Close aria-label="Close" />
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  );
}
