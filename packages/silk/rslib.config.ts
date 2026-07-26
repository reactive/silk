import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const dist = join(import.meta.dirname, 'dist');

/**
 * Emit `dist/index.layer.css` — the extracted stylesheet wrapped verbatim in
 * `@layer silk`, exported as `@reactive/silk/styles.layer.css`.
 *
 * Silk's rules are single-class specificity, so a consumer override of equal
 * specificity is decided by stylesheet order — an artifact of bundler module
 * graphs rather than anything a consumer controls. Inside a layer, any
 * unlayered consumer rule wins outright.
 *
 * Both files ship: the layered one also loses to unlayered consumer resets (an
 * unlayered `button { border: none }` would start winning), so it is opt-in.
 * Runs on every build, including watch, so the two can never diverge.
 */
const layeredCssPlugin: RsbuildPlugin = {
  name: 'silk:layered-css',
  setup(api) {
    api.onAfterBuild(() => {
      const source = readFileSync(join(dist, 'index.css'), 'utf8');

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
      // ESM-only: @reactive/silk-core is ESM and CJS require() cannot load it.
      format: 'esm',
      syntax: 'es2022',
      dts: {
        bundle: false,
      },
      bundle: true,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    target: 'web',
  },
  plugins: [pluginReact(), layeredCssPlugin],
  tools: {
    bundlerChain: (chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use('@wyw-in-js/webpack-loader')
        .loader('@wyw-in-js/webpack-loader')
        .options({
          sourceMap: true,
        })
        .before(CHAIN_ID.USE.SWC);
    },
  },
});
