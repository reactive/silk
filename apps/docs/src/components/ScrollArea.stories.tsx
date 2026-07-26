import { css } from '@linaria/core';
import { ScrollArea, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Interaction/ScrollArea',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const frameClass: string = css`
  height: 160px;
  width: 280px;
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
`;

const padClass: string = css`
  padding: 12px;
`;

export const Basic: Story = {
  render: (): JSX.Element => (
    <ScrollArea className={frameClass}>
      <div className={padClass}>
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i}>Row {i + 1} — scrollable content</Text>
        ))}
      </div>
    </ScrollArea>
  ),
};
