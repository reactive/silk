#!/usr/bin/env node
/**
 * Storybook docs dev runner.
 *
 * Storybook aliases `@reactive/silk` → source (HMR) but resolves
 * `@reactive/silk-core` from package exports → `dist/` so Linaria / runtime
 * imports can load compiled core. Editing core source is invisible until
 * `dist/` rebuilds — this script watch-builds core beside Storybook.
 *
 * Theme token CSS in docs comes from runtime `createTheme()` in preview.tsx
 * (inline CSS vars), so leaf-file tsc emits do not depend on Linaria
 * re-extracting `namedThemes.css.ts`.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function runSync(cmd, args) {
  const result = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return new Promise((resolve, reject) => {
    result.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

await runSync('yarn', ['workspace', '@reactive/silk-core', 'build']);

const children = [];
const coreWatch = run('yarn', [
  'workspace',
  '@reactive/silk-core',
  'build:watch',
]);
children.push(coreWatch);

const docs = run('yarn', ['workspace', '@reactive/silk-docs', 'storybook']);
children.push(docs);

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
docs.on('exit', (code) => shutdown(code ?? 0));
coreWatch.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[docs-dev] silk-core watch exited ${code}`);
    shutdown(code);
  }
});
