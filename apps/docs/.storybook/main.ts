import { mergeRsbuildConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import type { StorybookConfig } from 'storybook-react-rsbuild';

const config: StorybookConfig = {
  framework: {
    name: 'storybook-react-rsbuild',
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  typescript: {
    // Babel-based docgen — react-docgen-typescript does not support TypeScript 7.
    reactDocgen: 'react-docgen',
  },
  async rsbuildFinal(rsbuildConfig, { configType }) {
    const isProduction = configType === 'PRODUCTION';

    return mergeRsbuildConfig(rsbuildConfig, {
      plugins: [pluginReact()],
      resolve: {
        alias: {
          // Source for HMR, Linaria extraction, and prop tables.
          // silk-core stays on package exports → dist (Linaria eval).
          '@reactive/silk$': '../../packages/silk/src/index.ts',
        },
      },
      output: {
        // GitHub Pages project site: https://reactive.github.io/silk/
        assetPrefix: isProduction ? '/silk/' : '/',
      },
      tools: {
        bundlerChain: (chain, { CHAIN_ID }) => {
          chain.module
            .rule(CHAIN_ID.RULE.JS)
            .use('@wyw-in-js/webpack-loader')
            .loader('@wyw-in-js/webpack-loader')
            .options({
              // Production devtool is off, so maps would only be built to be dropped.
              sourceMap: !isProduction,
            })
            .before(CHAIN_ID.USE.SWC);
        },
      },
    });
  },
};

export default config;
