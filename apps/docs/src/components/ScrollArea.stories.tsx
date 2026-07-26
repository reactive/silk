import { styled } from '@linaria/react';
import { ScrollArea, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Interaction/ScrollArea',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = styled(ScrollArea)`
  height: 160px;
  width: 280px;
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
`;

const Pad = styled.div`
  padding: var(--silk-space-3);
`;

export const Basic: Story = {
  render: (): JSX.Element => (
    <Frame>
      <Pad>
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i}>Row {i + 1} — scrollable content</Text>
        ))}
      </Pad>
    </Frame>
  ),
};
