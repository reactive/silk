import { Button, Card, Inline, Pager, Stack, Text, usePagerIsActive } from '@reactive/silk-native';
import { type ComponentRef, type JSX, useRef, useState } from 'react';
import type { View } from 'react-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Pager',
  decorators: [withNativeSilk],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const PANES = ['Moves', 'Notes', 'Scoresheet'] as const;

/** A page's body, which says whether its pager shows it. */
function Pane({ name }: { readonly name: string }): JSX.Element {
  const active = usePagerIsActive();
  return (
    <Card style={{ flex: 1, margin: 8 }}>
      <Stack gap="2">
        <Text>{name}</Text>
        <Text tone="secondary">{active ? 'Shown: listening' : 'Hidden: not listening'}</Text>
      </Stack>
    </Card>
  );
}

function PagerDemo({
  refuse = false,
  disabled,
}: {
  readonly refuse?: boolean;
  readonly disabled?: string;
}): JSX.Element {
  const [pane, setPane] = useState<string>('Moves');
  // The escape hatch: the root takes a View ref and View props.
  const root = useRef<ComponentRef<typeof View>>(null);
  return (
    <Stack gap="3" style={{ width: 360 }}>
      <Inline gap="2">
        {PANES.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={name === pane ? 'solid' : 'soft'}
            onPress={() => setPane(name)}
          >
            {name}
          </Button>
        ))}
      </Inline>
      <Pager.Root
        ref={root}
        value={pane}
        onValueChange={(next) => {
          if (!refuse) setPane(next);
        }}
        style={{ height: 200 }}
      >
        {PANES.map((name) => (
          <Pager.Page key={name} value={name} disabled={name === disabled}>
            <Pane name={name} />
          </Pager.Page>
        ))}
      </Pager.Root>
    </Stack>
  );
}

/** Swipe between the panes, or press a button: the pages spring to the value. */
export const Controlled: Story = { render: () => <PagerDemo /> };

/** A swipe passes the disabled page by; only its button shows it. */
export const DisabledPage: Story = { render: () => <PagerDemo disabled="Notes" /> };

/** The owner keeps its value, so a swipe settles back. */
export const OwnerRefuses: Story = { render: () => <PagerDemo refuse /> };
