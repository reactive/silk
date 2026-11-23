import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(docsRoot, '../..');

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'jsdom',
  setupFiles: ['../../test/rstest-setup.ts', './.storybook/rstest.setup.ts'],
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  resolve: {
    alias: {
      'react-native': path.resolve(
        monorepoRoot,
        'node_modules/react-native-web',
      ),
      '@reactive/silk-native': path.resolve(
        monorepoRoot,
        'packages/silk-native/src/index.ts',
      ),
      '#floating-layer': path.resolve(
        monorepoRoot,
        'packages/silk-native/src/overlay/layer.dom.tsx',
      ),
      '#in-text': path.resolve(
        monorepoRoot,
        'packages/silk-native/src/components/inText.dom.ts',
      ),
    },
  },
});
