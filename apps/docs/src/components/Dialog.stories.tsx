import {
  Button,
  Dialog,
  SilkProvider,
  Stack,
  Text,
  dialogRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX, ReactNode } from 'react';
import { surfacePanelStyle } from '../surfacePanelStyle';

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Content,
  tags: ['autodocs'],
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
  <Stack direction="row" gap="2" align="center">
    <Dialog.Close asChild>
      <Button tone="neutral" variant="outline">
        Cancel
      </Button>
    </Dialog.Close>
    <Dialog.Close asChild>
      <Button>Confirm</Button>
    </Dialog.Close>
  </Stack>
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
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack direction="row" gap="2" wrap="wrap">
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
    </Stack>
  ),
};

export const NestedThemePortal: Story = {
  parameters: { controls: { disable: true } },
  render: (): JSX.Element => (
    <Stack gap="4">
      <Text tone="secondary">
        Body-portaled Dialog reconstitutes the nearest (inner dark)
        ThemeProvider scope — no `container` hatch required for nesting.
      </Text>
      <SilkProvider colorScheme="dark" style={surfacePanelStyle}>
        <Stack gap="3">
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
        </Stack>
      </SilkProvider>
    </Stack>
  ),
};
