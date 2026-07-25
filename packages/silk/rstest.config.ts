import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'jsdom',
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
});
