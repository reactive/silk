import type { Decorator, Preview } from 'storybook-react-rsbuild';
import {
  SilkProvider,
  type ColorScheme,
  type DensityName,
} from '@reactive/silk';
import type { JSX } from 'react';
import './preview.css';

const withSilkProvider: Decorator = (Story, context): JSX.Element => {
  const colorScheme = (context.globals.colorScheme ?? 'light') as
    | ColorScheme
    | 'system';
  const density = (context.globals.density ?? 'comfortable') as DensityName;

  return (
    <SilkProvider colorScheme={colorScheme} density={density}>
      <div className="silk-story-canvas">
        <Story />
      </div>
    </SilkProvider>
  );
};

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Introduction',
          'Theming',
          'Theme',
          'Fixtures',
          'Components',
          '*',
        ],
      },
    },
  },
  globalTypes: {
    colorScheme: {
      description: 'Silk named color scheme',
      toolbar: {
        title: 'Color scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'system', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'System density (space token remap)',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorScheme: 'light',
    density: 'comfortable',
  },
  decorators: [withSilkProvider],
};

export default preview;
