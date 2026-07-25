import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: true,
      bundle: true,
    },
    {
      format: 'cjs',
      syntax: 'es2022',
      bundle: true,
    },
  ],
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
