import { Button, Card, Inline, MotionList, MotionView, Stack, Text } from '@reactive/silk-native';
import { type JSX, useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { expect, userEvent, waitFor } from 'storybook/test';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/MotionList',
  decorators: [withNativeSilk],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const MOVES = ['e4', 'd4', 'Nf3', 'c4', 'g3'] as const;
const RARE = ['b3', 'f4'] as const;

/** Likely replies ranked by score: shuffling re-ranks them, and the rare ones come and go. */
function RankedMoves(): JSX.Element {
  const [order, setOrder] = useState<readonly string[]>(MOVES);
  const [rareShown, setRareShown] = useState(false);
  const shown = rareShown ? [...order, ...RARE] : order;
  return (
    <Stack gap="3" style={{ width: 280 }}>
      <Inline gap="2">
        <Button size="sm" onPress={() => setOrder((was) => [...was.slice(1), was[0]!])}>
          Re-rank
        </Button>
        <Button size="sm" variant="soft" onPress={() => setRareShown((was) => !was)}>
          {rareShown ? 'Hide rare' : 'Show rare'}
        </Button>
      </Inline>
      <Stack gap="1">
        {/* Only showing or hiding the rare moves fades rows; re-ranking glides them. */}
        <MotionList layoutDependency={rareShown}>
          {shown.map((move) => (
            <MotionView key={move} id={move} testID={`row-${move}`}>
              <Card style={{ padding: 8 }}>
                <Text>{move}</Text>
              </Card>
            </MotionView>
          ))}
        </MotionList>
      </Stack>
    </Stack>
  );
}

/** Re-rank to glide the rows to their new places; show the rare moves to fade them in. */
export const Ranked: Story = {
  // Plays Web Animations on laid-out rows, which jsdom has neither of: the browser test runner plays it.
  tags: ['needs-layout'],
  render: () => <RankedMoves />,
  play: async ({ canvas }) => {
    const animations = (testID: string) => canvas.getByTestId(testID).getAnimations().length;
    await userEvent.click(canvas.getByText('Re-rank'));
    // e4 went from first to last: it glides there.
    await expect(animations('row-e4')).toBeGreaterThan(0);
    await userEvent.click(canvas.getByText('Show rare'));
    await expect(animations('row-b3')).toBeGreaterThan(0);
    await userEvent.click(canvas.getByText('Hide rare'));
    // It fades out where it was, out of reach, then goes.
    await expect(canvas.getByTestId('row-b3').inert).toBe(true);
    await waitFor(() => expect(canvas.queryByTestId('row-b3')).toBeNull());
  },
};
