import { styled } from '@linaria/react';
import { Button, Tooltip } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Tooltip',
  component: Tooltip.Content,
  parameters: {
    docs: {
      description: {
        component:
          'Mount `Tooltip.Provider` once at the app or surface root. It owns delay coordination and skip-delay across tooltips. Content portals reconstitute theme scope.',
      },
    },
  },
} satisfies Meta<typeof Tooltip.Content>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button>Hover</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Helpful tip</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Hover' }));
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Helpful tip',
    );
  },
};

/**
 * Tooltip has no public CSS variables — the surface is shared with Popover and
 * Menu. `styled(Tooltip.Content)` is the override path, and can reach the
 * `data-side` attribute Radix sets on the content.
 */
const InvertedTip = styled(Tooltip.Content)`
  background-color: var(--silk-color-text-primary);
  color: var(--silk-color-surface);
  border-color: transparent;

  &[data-side='top'] {
    margin-bottom: var(--silk-space-1);
  }
`;

export const StyledContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`styled(Tooltip.Content)` — Silk styles variants through `:where([data-…])`, so a consumer class outranks them and can key off the same `data-*` state.',
      },
    },
  },
  render: (): JSX.Element => (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button variant="outline">Styled tip</Button>
        </Tooltip.Trigger>
        <InvertedTip>styled escape hatch</InvertedTip>
      </Tooltip.Root>
    </Tooltip.Provider>
  ),
};
