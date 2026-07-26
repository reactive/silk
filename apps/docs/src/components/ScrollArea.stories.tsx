import { ScrollArea, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Interaction/ScrollArea',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <ScrollArea style={{ height: 160, width: 280, border: '1px solid var(--silk-color-border-subtle)', borderRadius: 'var(--silk-radius-md)' }}>
      <div style={{ padding: 12 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i}>Row {i + 1} — scrollable content</Text>
        ))}
      </div>
    </ScrollArea>
  ),
};
