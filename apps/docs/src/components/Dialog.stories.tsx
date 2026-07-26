import {
  Button,
  Dialog,
  Inline,
  SilkProvider,
  Stack,
  Text,
  dialogRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';
import { withSource } from '../docsSource';
import { SurfacePanel } from '../surfacePanel';
import surfacePanelSource from '../surfacePanel.tsx?raw';
import {
  DialogBody,
  LayeringStory,
  confirmActions,
} from './Dialog.demo';
import dialogDemoSource from './Dialog.demo.tsx?raw';

const meta = {
  title: 'Components/Interaction/Dialog',
  component: Dialog.Content,
  parameters: {
    docs: {
      description: {
        component:
          'Radix owns focus, keyboard, and portal behavior; Silk owns visuals. Use `Dialog.Root` + parts, or compose with `Dialog.Content` for Portal+Overlay+Content. Body portals reconstitute the nearest ThemeProvider scope.',
      },
      ...withSource(dialogDemoSource, surfacePanelSource).docs,
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
