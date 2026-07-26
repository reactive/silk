import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withSource } from '../docsSource';
import { InspectorPanel, type InspectorPanelState } from './InspectorPanel';
import inspectorPanelSource from './InspectorPanel.tsx?raw';

const states: InspectorPanelState[] = [
  'normal',
  'overlaysOpen',
  'longContent',
  'reducedMotion',
  'nestedTheme',
  'multipleToasts',
];

const meta = {
  title: 'Fixtures/InspectorPanel',
  component: InspectorPanel,
  parameters: withSource(inspectorPanelSource),
  argTypes: {
    state: {
      control: 'select',
      options: states,
    },
  },
  args: {
    state: 'normal',
  },
} satisfies Meta<typeof InspectorPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { state: 'normal' } };
export const OverlaysOpen: Story = {
  args: { state: 'overlaysOpen' },
  parameters: {
    // Select/DropdownMenu leave triggers under aria-hidden while open (Radix).
    a11y: {
      config: {
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
};
export const LongContent: Story = { args: { state: 'longContent' } };
export const ReducedMotion: Story = {
  args: { state: 'reducedMotion' },
  parameters: {
    chromatic: { prefersReducedMotion: 'reduce' },
  },
};
export const NestedTheme: Story = { args: { state: 'nestedTheme' } };
export const MultipleToasts: Story = { args: { state: 'multipleToasts' } };
