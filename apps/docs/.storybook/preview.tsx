import type { Decorator, Preview } from 'storybook-react-rsbuild';
import { SilkProvider, type ColorScheme } from '@reactive/silk';
import type { JSX } from 'react';
import './preview.css';

const withSilkProvider: Decorator = (Story, context): JSX.Element => {
  const colorScheme = (context.globals.colorScheme ?? 'light') as
    | ColorScheme
    | 'system';

  return (
    <SilkProvider colorScheme={colorScheme}>
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
        order: ['Introduction', 'Theming', 'Theme', 'Components', '*'],
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
  },
  initialGlobals: {
    colorScheme: 'light',
  },
  decorators: [withSilkProvider],
};

export default preview;
