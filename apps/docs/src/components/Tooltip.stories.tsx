import { css } from '@linaria/core';
import { Button, Tooltip } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Interaction/Tooltip',
  component: Tooltip.Content,
  tags: ['autodocs'],
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
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button>Hover</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Helpful tip</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  ),
};

/**
 * Tooltip has no public CSS variables — the surface is shared with Popover and
 * Menu. Slot-level `className` is the override path, and a Linaria class can
 * reach the `data-side` attribute Radix sets on the content.
 */
const invertedTipClass: string = css`
  background-color: var(--silk-color-text-primary);
  color: var(--silk-color-surface);
  border-color: transparent;

  &[data-side='top'] {
    margin-bottom: var(--silk-space-1);
  }
`;

export const EscapeHatchClassName: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A Linaria class on the content slot. Silk styles variants through `:where([data-…])`, so a plain consumer class outranks them — and can key off the same `data-*` state.',
      },
    },
  },
  render: (): JSX.Element => (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button variant="outline">Styled tip</Button>
        </Tooltip.Trigger>
        <Tooltip.Content className={invertedTipClass}>
          className escape hatch
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  ),
};
