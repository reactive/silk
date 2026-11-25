import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';
import { reactNativeWeb } from '../../config/reactNativeWeb';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const rnWeb = reactNativeWeb(path.resolve(packageRoot, '../..'));

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'jsdom',
  setupFiles: ['../../test/rstest-setup.ts'],
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  source: { define: rnWeb.define },
  resolve: {
    extensions: rnWeb.extensions,
    alias: {
      // The web layer: tests render through react-native-web.
      ...rnWeb.alias,
      '#floating-layer': path.resolve(packageRoot, 'src/overlay/layer.dom.tsx'),
      '#in-text': path.resolve(packageRoot, 'src/components/inText.dom.ts'),
      '#motion-list': path.resolve(packageRoot, 'src/components/MotionList/MotionList.dom.tsx'),
    },
  },
});
