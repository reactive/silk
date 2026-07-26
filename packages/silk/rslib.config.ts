import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const dist = join(import.meta.dirname, 'dist');
const stripLoader = join(import.meta.dirname, 'loaders/strip-wyw-css-import.cjs');

function withWyw(
  chain: {
    module: {
      rule: (name: string) => {
        use: (name: string) => {
          loader: (path: string) => {
            options: (opts: { sourceMap: boolean }) => {
              before: (name: string) => unknown;
            };
            before: (name: string) => unknown;
          };
        };
      };
    };
  },
  CHAIN_ID: { RULE: { JS: string }; USE: { SWC: string } },
  options: { stripCssImport: boolean },
): void {
  chain.module
    .rule(CHAIN_ID.RULE.JS)
    .use('@wyw-in-js/webpack-loader')
    .loader('@wyw-in-js/webpack-loader')
    .options({
      sourceMap: true,
    })
    .before(CHAIN_ID.USE.SWC);

  if (options.stripCssImport) {
    // Chain order [strip, wyw, SWC] → execute SWC → wyw → strip (right-to-left).
    chain.module
      .rule(CHAIN_ID.RULE.JS)
      .use('silk-strip-wyw-css-import')
      .loader(stripLoader)
      .before('@wyw-in-js/webpack-loader');
  }
}

/**
 * Finalize aggregate CSS from the CSS-only bundle pass:
 * - rename `dist/__styles.css` → `dist/index.css`
 * - emit `dist/index.layer.css` (same rules wrapped in `@layer silk`)
 * - delete the unused `__styles.js` (+ map)
 *
 * Silk's rules are single-class specificity, so a consumer override of equal
 * specificity is decided by stylesheet order — an artifact of bundler module
 * graphs rather than anything a consumer controls. Inside a layer, any
 * unlayered consumer rule wins outright.
 *
 * Both files ship: the layered one also loses to unlayered consumer resets (an
 * unlayered `button { border: none }` would start winning), so it is opt-in.
 */
const layeredCssPlugin: RsbuildPlugin = {
  name: 'silk:layered-css',
  setup(api) {
    api.onAfterBuild(() => {
      const stylesPath = join(dist, '__styles.css');
      const indexCssPath = join(dist, 'index.css');

      // Bundleless JS pass finishes first and has no CSS artifact yet.
      if (!existsSync(stylesPath)) {
        return;
      }

      renameSync(stylesPath, indexCssPath);

      for (const leftover of ['__styles.js', '__styles.js.map']) {
        const path = join(dist, leftover);
        if (existsSync(path)) {
          unlinkSync(path);
        }
      }

      const source = readFileSync(indexCssPath, 'utf8');

      // `@import` and `@charset` may not appear inside a layer block. Linaria
      // emits neither; fail loudly rather than shipping a stylesheet the
      // parser drops. Unanchored so a future minifier collapsing the sheet
      // onto one line cannot blind the guard.
      const illegal = source.match(/@(import|charset)\b/);
      if (illegal) {
        throw new Error(
          `silk:layered-css: cannot wrap stylesheet containing ${illegal[0]}`,
        );
      }

      writeFileSync(
        join(dist, 'index.layer.css'),
        `@layer silk {\n${source.trimEnd()}\n}\n`,
      );
    });
  },
};

export default defineConfig({
  lib: [
    {
      // Pass A: per-file ESM so consumer bundlers can tree-shake named imports.
      // ESM-only: @reactive/silk-core is ESM and CJS require() cannot load it.
      format: 'esm',
      syntax: 'es2022',
      bundle: false,
      dts: {
        bundle: false,
      },
      source: {
        entry: {
          index: [
            './src/**',
            '!./src/**/*.test.ts',
            '!./src/**/*.test.tsx',
            '!./src/test/**',
          ],
        },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
      },
      tools: {
        bundlerChain: (chain, { CHAIN_ID }) => {
          withWyw(chain, CHAIN_ID, { stripCssImport: true });
        },
      },
    },
    {
      // Pass B: CSS-only aggregate for `@reactive/silk/styles.css`. Distinct
      // entry name so this pass cannot clobber Pass A's `dist/index.js`.
      format: 'esm',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      source: {
        entry: {
          __styles: './src/index.ts',
        },
      },
      output: {
        // Pass A already cleaned/wrote JS; do not wipe it.
        cleanDistPath: false,
      },
      tools: {
        bundlerChain: (chain, { CHAIN_ID }) => {
          withWyw(chain, CHAIN_ID, { stripCssImport: false });
        },
      },
    },
  ],
  output: {
    target: 'web',
  },
  plugins: [pluginReact({ reactCompiler: true }), layeredCssPlugin],
});
