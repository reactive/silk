import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(packageRoot, '../..');

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'jsdom',
  setupFiles: ['../../test/rstest-setup.ts'],
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  resolve: {
    alias: {
      'react-native': path.resolve(
        monorepoRoot,
        'node_modules/react-native-web',
      ),
    },
  },
});
