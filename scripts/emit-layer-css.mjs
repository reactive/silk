#!/usr/bin/env node
/**
 * Emit `dist/index.layer.css` — the extracted stylesheet wrapped in
 * `@layer silk`.
 *
 * Silk's own rules are single-class specificity, so a consumer override of the
 * same specificity is decided by stylesheet order, which is an artifact of
 * bundler module graphs rather than anything a consumer controls. Inside a
 * layer, any unlayered consumer rule wins outright.
 *
 * Both files ship: the layered one changes how *consumer* resets interact with
 * Silk (an unlayered `button { border: none }` would now win), so it is opt-in.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(
  dirname(fileURLToPath(import.meta.url)),
  '../packages/silk/dist',
);
const source = readFileSync(join(dist, 'index.css'), 'utf8');

// `@import` and `@charset` may not appear inside a layer block. Linaria emits
// neither; fail loudly rather than shipping a stylesheet the parser drops.
// Unanchored so a future minifier collapsing the sheet onto one line cannot
// blind the guard.
const illegal = source.match(/@(import|charset)\b/);
if (illegal) {
  throw new Error(
    `emit-layer-css: cannot wrap stylesheet containing ${illegal[0]}`,
  );
}

// Byte-identical wrapping — `packed-consumer-check.mjs` asserts the round trip.
writeFileSync(
  join(dist, 'index.layer.css'),
  `@layer silk {\n${source.trimEnd()}\n}\n`,
);

console.log('emit-layer-css: wrote dist/index.layer.css');
