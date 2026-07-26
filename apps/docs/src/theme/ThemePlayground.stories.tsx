import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { withSource } from '../docsSource';
import { ThemePlayground } from './ThemePlayground';
import playgroundSource from './ThemePlayground.tsx?raw';

const meta = {
  title: 'Theme/ThemePlayground',
  component: ThemePlayground,
  argTypes: {
    brandSeed: { control: 'color' },
    colorScheme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
    },
    surface: { control: 'color' },
    radiusMd: { control: { type: 'number', min: 0, max: 24, step: 1 } },
  },
  args: {
    brandSeed: '#0ea5e9',
    colorScheme: 'light',
    radiusMd: 8,
  },
  parameters: {
    docs: {
      description: {
        component:
          'Live token editing against real components. Builds `createTheme` + `generatePairedPalette` from controls (debounced) and applies via inline CSS variables. Shows `checkThemeContrast` status.',
      },
      ...withSource(playgroundSource).docs,
    },
  },
} satisfies Meta<typeof ThemePlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  tags: ['test'],
  render: (args): JSX.Element => <ThemePlayground {...args} />,
  play: async ({ canvasElement }): Promise<void> => {
    const root = canvasElement.querySelector('[data-fixture="theme-playground"]');
    if (!root) {
      throw new Error('Theme playground did not mount');
    }
    const contrast = root.querySelector('[data-contrast]');
    if (!contrast) {
      throw new Error('Contrast readout missing');
    }
  },
};
