import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';
import { reactNativeWeb } from '../../test/reactNativeWeb';

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(docsRoot, '../..');
const rnWeb = reactNativeWeb(monorepoRoot);

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'jsdom',
  setupFiles: ['../../test/rstest-setup.ts', './.storybook/rstest.setup.ts'],
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  source: { define: rnWeb.define },
  resolve: {
    extensions: rnWeb.extensions,
    alias: {
      ...rnWeb.alias,
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
