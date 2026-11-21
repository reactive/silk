import {
  Button,
  Dialog,
  Listbox,
  Popover,
  Inline,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@reactive/silk-native';
import { type ComponentRef, type JSX, useRef, useState } from 'react';
import type { View } from 'react-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Overlays',
  decorators: [withNativeSilk],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function DialogDemo({ placement }: { readonly placement: 'center' | 'bottom' }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>
        {placement === 'bottom' ? 'Open sheet' : 'Open dialog'}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content placement={placement} size="sm">
          <Stack gap="3">
            <Dialog.Title>Notifications</Dialog.Title>
            <Text tone="secondary">
              Escape, a press on the veil, or Android&apos;s back button closes it.
            </Text>
            <Button onPress={() => setOpen(false)}>Done</Button>
          </Stack>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

export const CenteredDialog: Story = { render: () => <DialogDemo placement="center" /> };

export const BottomSheet: Story = { render: () => <DialogDemo placement="bottom" /> };

const SIZES = ['Small', 'Medium', 'Large', 'Extra large'] as const;

function PopoverListboxDemo(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('Medium');
  const anchor = useRef<ComponentRef<typeof View>>(null);
  return (
    <>
      <Button ref={anchor} variant="soft" onPress={() => setOpen((was) => !was)}>
        {`Size: ${value}`}
      </Button>
      <Popover.Root open={open} onOpenChange={setOpen} anchor={anchor}>
        <Popover.Content size="sm" align="start">
          <Listbox.Root
            accessibilityLabel="Size"
            value={value}
            onValueChange={setValue}
            autoFocus
          >
            {SIZES.map((size) => (
              <Listbox.Item key={size} value={size}>
                {size}
              </Listbox.Item>
            ))}
          </Listbox.Root>
        </Popover.Content>
      </Popover.Root>
    </>
  );
}

/** A Popover holding a Listbox: arrows move, Space or Enter picks, a pick closes it. */
export const PopoverWithListbox: Story = { render: () => <PopoverListboxDemo /> };

function TooltipDemo(): JSX.Element {
  return (
    <Inline gap="3" align="center">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Switch accessibilityLabel="Hints" accessibilityHint="Only in Explore" disabled checked={false} />
        </Tooltip.Trigger>
        <Tooltip.Content>Only in Explore</Tooltip.Content>
      </Tooltip.Root>
      <Text tone="secondary">Rest the pointer on the disabled switch, or tap it.</Text>
    </Inline>
  );
}

export const TooltipOnDisabledControl: Story = { render: () => <TooltipDemo /> };
