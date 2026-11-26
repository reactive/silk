import { Button, Card, Inline, Pager, Stack, Text, usePagerIsActive } from '@reactive/silk-native';
import { type ComponentRef, type JSX, useRef, useState } from 'react';
import { ScrollView, type View } from 'react-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { expect } from 'storybook/test';
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
  indicator = false,
}: {
  readonly refuse?: boolean;
  readonly disabled?: string;
  readonly indicator?: boolean;
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
        {indicator ? <Pager.Indicator testID="indicator" /> : null}
      </Pager.Root>
    </Stack>
  );
}

/** Swipe between the panes, or press a button: the pages spring to the value. */
export const Controlled: Story = { render: () => <PagerDemo /> };

/** A swipe passes the disabled page by, to the page beyond; only its button shows it. */
export const DisabledPage: Story = { render: () => <PagerDemo disabled="Notes" /> };

/**
 * A dot for each page at the pager's foot, the shown page's a pill that
 * passes from dot to dot as a swipe moves the pages; the disabled page's dot
 * is fainter.
 */
export const Indicator: Story = {
  // Measures widths, which jsdom doesn't lay out: the browser test runner plays it.
  tags: ['needs-layout'],
  render: () => <PagerDemo indicator disabled="Scoresheet" />,
  play: async ({ canvas }) => {
    const dots = [...canvas.getByTestId('indicator').children];
    await expect(dots.map((dot) => dot.getBoundingClientRect().width > 12)).toEqual([
      true,
      false,
      false,
    ]);
  },
};

/** The owner keeps its value, so a swipe settles back. */
export const OwnerRefuses: Story = { render: () => <PagerDemo refuse /> };

/** A pager with a height holds its pages to it, so a long page scrolls inside. */
export const ScrollingPage: Story = {
  // Measures heights, which jsdom doesn't lay out: the browser test runner plays it.
  tags: ['needs-layout'],
  render: () => (
    <Pager.Root
      value="Moves"
      onValueChange={() => {}}
      style={{ width: 360, height: 140 }}
      testID="pager"
    >
      <Pager.Page value="Moves" testID="page">
        {/* Focusable, so a keyboard can scroll it. */}
        <ScrollView testID="moves" focusable aria-label="Moves">
          {Array.from({ length: 20 }, (_, move) => (
            <Text key={move}>Move {move + 1}</Text>
          ))}
        </ScrollView>
      </Pager.Page>
      <Pager.Page value="Notes">
        <Text>Notes</Text>
      </Pager.Page>
    </Pager.Root>
  ),
  play: async ({ canvas }) => {
    const height = (testID: string) => canvas.getByTestId(testID).getBoundingClientRect().height;
    await expect(height('page')).toBe(height('pager'));
    const moves = canvas.getByTestId('moves');
    await expect(moves.scrollHeight).toBeGreaterThan(moves.clientHeight);
  },
};
