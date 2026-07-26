import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.css',
);

/**
 * Read the extracted stylesheet. Conformance tests assert against build output
 * rather than source intent, so they require a fresh `yarn build`.
 */
export function loadDistCss(): string {
  return readFileSync(cssPath, 'utf8');
}
