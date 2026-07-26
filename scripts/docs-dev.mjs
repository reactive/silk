#!/usr/bin/env node
/**
 * Storybook docs dev runner: watch-build silk-core beside Storybook.
 *
 * Storybook aliases `@reactive/silk` to source, but resolves
 * `@reactive/silk-core` through package exports to `dist/`, so core edits stay
 * invisible until dist rebuilds. Pre-build so Storybook does not resolve an
 * empty dist on boot. See docs/ARCHITECTURE.md, "Build order".
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spawnOpts = {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
};

const build = spawnSync(
  'yarn',
  ['workspace', '@reactive/silk-core', 'build'],
  spawnOpts,
);
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const result = spawnSync(
  'concurrently',
  [
    '-k',
    '-s',
    'first',
    '-n',
    'core,storybook',
    'yarn workspace @reactive/silk-core build:watch',
    'yarn workspace @reactive/silk-docs storybook',
  ],
  spawnOpts,
);
process.exit(result.status ?? 1);
