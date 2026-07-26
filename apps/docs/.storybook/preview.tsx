import type { Decorator, Preview } from 'storybook-react-rsbuild';
import {
  SilkProvider,
  createTheme,
  type ColorScheme,
  type DensityName,
  type Theme,
} from '@reactive/silk';
import type { JSX } from 'react';
import '@fontsource-variable/inter';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/jetbrains-mono';
import './preview.css';

// Runtime theme vars (inline) so silk-core token edits apply after `dist/`
// rebuilds without waiting for Linaria to re-extract namedThemes.css.ts.
// Built once per module evaluation: ThemeProvider memoizes on theme identity,
// and HMR re-runs this after a core rebuild. `system` keeps the static named
// themes so prefers-color-scheme still applies.
const runtimeThemes: Record<ColorScheme, Theme> = {
  light: createTheme({ colorScheme: 'light' }),
  dark: createTheme({ colorScheme: 'dark' }),
};

const withSilkProvider: Decorator = (Story, context): JSX.Element => {
  const colorScheme = (context.globals.colorScheme ?? 'light') as
    | ColorScheme
    | 'system';
  const density = (context.globals.density ?? 'comfortable') as DensityName;

  return (
    <SilkProvider
      {...(colorScheme === 'system'
        ? { colorScheme }
        : { theme: runtimeThemes[colorScheme] })}
      density={density}
    >
      <div className="silk-story-canvas">
        <Story />
      </div>
    </SilkProvider>
  );
};

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      codePanel: true,
    },
    a11y: {
      test: 'error',
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Theming',
          'Theme',
          'Fixtures',
          [
            'Components',
            [
              'Layout',
              'Visual',
              'Forms',
              'Interaction',
              'Composite',
              '*',
            ],
          ],
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
