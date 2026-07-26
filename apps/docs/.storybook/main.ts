import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeRsbuildConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import remarkGfm from 'remark-gfm';
import type { StorybookConfig } from 'storybook-react-rsbuild';

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(docsRoot, '../../..');

const config: StorybookConfig = {
  framework: {
    name: 'storybook-react-rsbuild',
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            // CommonMark only by default — GFM needed for pipe tables in MDX.
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-a11y',
  ],
  typescript: {
    // Babel-based docgen — react-docgen-typescript does not support TypeScript 7.
    reactDocgen: 'react-docgen',
  },
  async rsbuildFinal(rsbuildConfig, { configType }) {
    const isProduction = configType === 'PRODUCTION';

    return mergeRsbuildConfig(rsbuildConfig, {
      plugins: [
        pluginReact(isProduction ? { reactCompiler: true } : undefined),
      ],
      resolve: {
        alias: {
          // Source for HMR, Linaria extraction, and prop tables.
          // silk-core stays on package exports → dist (Linaria eval + runtime).
          // `yarn docs` watch-builds core; preview applies createTheme() inline
          // so token edits do not wait on namedThemes re-extraction.
          '@reactive/silk$': '../../packages/silk/src/index.ts',
          '@reactive/silk-native$':
            '../../packages/silk-native/src/index.ts',
          'react-native': path.resolve(
            monorepoRoot,
            'node_modules/react-native-web',
          ),
        },
      },
      output: {
        // GitHub Pages project site: https://reactive.github.io/silk/
        assetPrefix: isProduction ? '/silk/' : '/',
      },
      tools: {
        rspack: (rspackConfig) => {
          // storybook-react-rsbuild installs react-docgen as enforce:'pre'. That
          // mutates TSX before `?raw` / asset/source can read it — exclude raw.
          for (const rule of rspackConfig.module?.rules ?? []) {
            if (
              rule &&
              typeof rule === 'object' &&
              'loader' in rule &&
              typeof rule.loader === 'string' &&
              rule.loader.includes('react-docgen-loader')
            ) {
              rule.resourceQuery = { not: [/raw/] };
            }
          }
          return rspackConfig;
        },
        bundlerChain: (chain, { CHAIN_ID }) => {
          // Keep `?raw` on asset/source so wyw/SWC never transform imported sources
          // used by the code panel (`docs.source` attachments).
          chain.module
            .rule('silk-raw-source')
            .resourceQuery(/raw/)
            .type('asset/source');
          chain.module.rule(CHAIN_ID.RULE.JS).resourceQuery({ not: /raw/ });

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
