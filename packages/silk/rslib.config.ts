import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

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
  plugins: [pluginReact()],
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
