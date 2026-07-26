/**
 * Node smoke: workspace resolve + built dist mappers + tenant theme.
 * Full recipe matrices live in packages/silk-native tests (not duplicated here).
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createTheme,
  generatePairedPalette,
} from '@reactive/silk-core';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(scriptDir, '../../..');

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(msg);
  }
}

// Throws if the workspace package is not resolvable from this app.
require.resolve('@reactive/silk-native/package.json');

const { mapButtonStyle, mapTextStyle }: Pick<
  typeof import('@reactive/silk-native'),
  'mapButtonStyle' | 'mapTextStyle'
> = await import(
  pathToFileURL(
    path.join(monorepoRoot, 'packages/silk-native/dist/styles/mapStyles.js'),
  ).href
);

const pair = generatePairedPalette('#0ea5e9');
const theme = createTheme({ colorScheme: 'light', palette: pair.light });

assert(theme.semantic.color.surface.length > 0, 'tenant theme has surface');
assert(
  mapTextStyle(theme, { tone: 'success' }).color ===
    theme.semantic.color.tones.success.text,
  'text',
);
assert(
  mapButtonStyle(theme, { variant: 'soft' }, true).view.backgroundColor ===
    theme.semantic.color.tones.accent.subtleActive,
  'button pressed soft',
);

console.log('native-example smoke OK');
