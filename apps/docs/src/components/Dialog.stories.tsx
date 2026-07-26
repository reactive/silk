import {
  Button,
  Dialog,
  Inline,
  Popover,
  Select,
  SilkProvider,
  Stack,
  Text,
  Toast,
  Tooltip,
  dialogRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState, type JSX, type ReactNode } from 'react';
import { expect, screen, userEvent } from 'storybook/test';
import { SurfacePanel } from '../surfacePanel';

const meta = {
  title: 'Components/Interaction/Dialog',
  component: Dialog.Content,
  parameters: {
    docs: {
      description: {
        component:
          'Radix owns focus, keyboard, and portal behavior; Silk owns visuals. Use `Dialog.Root` + parts, or compose with `Dialog.Content` for Portal+Overlay+Content. Body portals reconstitute the nearest ThemeProvider scope.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: [...dialogRecipe.variants.size],
    },
  },
} satisfies Meta<typeof Dialog.Content>;

export default meta;

type Story = StoryObj<typeof meta>;

function DialogBody({
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

const confirmActions = (
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

export const Basic: Story = {
  args: { size: dialogRecipe.defaults.size },
  render: ({ size = dialogRecipe.defaults.size }): JSX.Element => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Open dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content size={size}>
        <DialogBody
          title="Confirm action"
          description="Escape closes the dialog and focus returns to the trigger. Title and description provide accessible naming."
          actions={confirmActions}
        />
      </Dialog.Content>
    </Dialog.Root>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    // Prefer findByRole over toBeVisible — enter animation can fail visibility.
    await expect(
      await screen.findByRole('dialog', { name: 'Confirm action' }),
    ).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  tags: ['!test'],
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Inline gap="2" wrap="wrap">
      {dialogRecipe.variants.size.map((size) => (
        <Dialog.Root key={size}>
          <Dialog.Trigger asChild>
            <Button variant="soft" tone="neutral">
              Open {size}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content size={size}>
            <DialogBody
              title={`Size: ${size}`}
              description="Dialog content width follows the recipe size token."
              actions={
                <Dialog.Close asChild>
                  <Button>Close</Button>
                </Dialog.Close>
              }
            />
          </Dialog.Content>
        </Dialog.Root>
      ))}
    </Inline>
  ),
};

function LayeringStory(): JSX.Element {
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

export const Layering: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Every body portal shares one stacking scale. The dialog deliberately sits below popovers, menus, tooltips, and toasts, so an overlay opened from inside it — a sibling of the panel rather than a descendant — still paints on top.',
      },
    },
  },
  render: (): JSX.Element => <LayeringStory />,
};

export const NestedThemePortal: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      <Text tone="secondary">
        Body-portaled Dialog reconstitutes the nearest (inner dark)
        ThemeProvider scope — no `container` hatch required for nesting.
      </Text>
      <SilkProvider colorScheme="dark">
        <SurfacePanel gap="3">
          <Text>Nested dark scope</Text>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button>Open in nested theme</Button>
            </Dialog.Trigger>
            <Dialog.Content size="sm">
              <DialogBody
                title="Nested theme dialog"
                description="Portaled to document.body while keeping the inner dark theme scope."
                actions={
                  <Dialog.Close asChild>
                    <Button>Close</Button>
                  </Dialog.Close>
                }
              />
            </Dialog.Content>
          </Dialog.Root>
        </SurfacePanel>
      </SilkProvider>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open in nested theme' }),
    );
    await expect(
      await screen.findByRole('dialog', { name: 'Nested theme dialog' }),
    ).toBeInTheDocument();
  },
};
