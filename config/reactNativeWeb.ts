import path from 'node:path';

/**
 * Bundler settings for rendering silk-native through react-native-web
 * (Storybook and the jsdom tests): `react-native` aliased to the web
 * renderer, the `.web.*` twins Gesture Handler and Reanimated ship resolved
 * first, and Metro's `__DEV__` and `global` defined (Reanimated's web
 * runtime keeps its animated styles' mappers on `global`).
 */
export function reactNativeWeb(monorepoRoot: string, { dev = true }: { dev?: boolean } = {}) {
  return {
    alias: { 'react-native': path.resolve(monorepoRoot, 'node_modules/react-native-web') },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    define: { __DEV__: JSON.stringify(dev), global: 'globalThis' },
  };
}
