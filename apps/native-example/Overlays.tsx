import {
  Button,
  Dialog,
  Inline,
  Listbox,
  Popover,
  Stack,
  Text,
} from '@reactive/silk-native';
import { type ComponentRef, type JSX, useRef, useState } from 'react';
import type { View } from 'react-native';

const PLANS = [
  { value: 'free', label: 'Free', hint: 'One project' },
  { value: 'pro', label: 'Pro', hint: 'Unlimited projects' },
  { value: 'team', label: 'Team', hint: 'Shared workspaces' },
  { value: 'enterprise', label: 'Enterprise', hint: 'SSO and audit log', disabled: true },
] as const;

/** Dialog (centered and as a bottom sheet) and a Popover holding a Listbox. */
export function Overlays(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Kept while closing, so a sheet fades out as a sheet.
  const [placement, setPlacement] = useState<'center' | 'bottom'>('center');
  const openDialog = (at: 'center' | 'bottom') => {
    setPlacement(at);
    setDialogOpen(true);
  };
  const [picking, setPicking] = useState(false);
  const [plan, setPlan] = useState('pro');
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const chosen = PLANS.find((p) => p.value === plan);
  return (
    <Stack gap="2">
      <Text role="heading">Overlays</Text>
      <Inline gap="2" wrap="wrap">
        <Button size="sm" onPress={() => openDialog('center')} testID="open-dialog">
          Dialog
        </Button>
        <Button size="sm" variant="outline" onPress={() => openDialog('bottom')} testID="open-sheet">
          Sheet
        </Button>
        <Button
          ref={anchor}
          size="sm"
          variant="outline"
          tone="neutral"
          onPress={() => setPicking((was) => !was)}
          testID="open-popover"
        >
          Plan: {chosen?.label}
        </Button>
      </Inline>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content placement={placement} testID="dialog">
          <Stack gap="5">
            <Stack gap="2">
              <Dialog.Title>Rename project</Dialog.Title>
              <Text tone="secondary" measure="prose">
                The new name shows everywhere the project appears, including shared links.
              </Text>
            </Stack>
            <Inline gap="2" justify="end">
              <Button variant="ghost" tone="neutral" onPress={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onPress={() => setDialogOpen(false)}>Rename</Button>
            </Inline>
          </Stack>
        </Dialog.Content>
      </Dialog.Root>
      <Popover.Root open={picking} onOpenChange={setPicking} anchor={anchor}>
        <Popover.Content size="sm" side="bottom" align="start" testID="popover">
          <Listbox.Root accessibilityLabel="Plan" value={plan} onValueChange={setPlan}>
            {PLANS.map((p) => (
              <Listbox.Item
                key={p.value}
                value={p.value}
                disabled={'disabled' in p ? p.disabled : false}
                accessibilityLabel={`${p.label}, ${p.hint}`}
              >
                <Stack gap="0">
                  <Listbox.ItemText>{p.label}</Listbox.ItemText>
                  <Listbox.ItemText role="caption" tone="secondary">
                    {p.hint}
                  </Listbox.ItemText>
                </Stack>
              </Listbox.Item>
            ))}
          </Listbox.Root>
        </Popover.Content>
      </Popover.Root>
    </Stack>
  );
}
