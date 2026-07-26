#!/usr/bin/env node
/**
 * Packed-consumer check: pack both packages, install into a temp fixture,
 * verify CSS lands, ESM import works, and no runtime style-generation markers ship.
 */
import { execSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(join(tmpdir(), 'silk-packed-'));

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

try {
  run('yarn workspace @reactive/silk-core build');
  run('yarn workspace @reactive/silk build');

  run('yarn workspace @reactive/silk-core pack --out ../../silk-core.tgz');
  run('yarn workspace @reactive/silk pack --out ../../silk.tgz');

  writeFileSync(
    join(fixture, 'package.json'),
    JSON.stringify(
      {
        name: 'silk-packed-consumer',
        private: true,
        type: 'module',
        dependencies: {
          '@reactive/silk-core': `file:${join(root, 'silk-core.tgz')}`,
          '@reactive/silk': `file:${join(root, 'silk.tgz')}`,
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
      },
      null,
      2,
    ),
  );

  run('npm install --ignore-scripts', fixture);

  const cssPath = join(
    fixture,
    'node_modules/@reactive/silk/dist/index.css',
  );
  if (!existsSync(cssPath)) {
    throw new Error(`Missing CSS at ${cssPath}`);
  }
  const css = readFileSync(cssPath, 'utf8');
  for (const needle of [
    '--silk-color-surface',
    '--silk-space-compact-2',
    '--silk-space-comfortable-2',
    'data-variant',
    'data-density',
    'data-collapse-below',
    '@container',
    'prefers-reduced-motion',
  ]) {
    if (!css.includes(needle)) {
      throw new Error(`Packed CSS missing ${needle}`);
    }
  }

  const distDir = join(fixture, 'node_modules/@reactive/silk/dist');
  const listing = execSync(`find "${distDir}" -name '*.test.*'`, {
    encoding: 'utf8',
  }).trim();
  if (listing) {
    throw new Error(`Test artifacts shipped in package:\n${listing}`);
  }

  const entryUrl = pathToFileURL(
    join(fixture, 'node_modules/@reactive/silk/dist/index.js'),
  ).href;
  const mod = await import(entryUrl);
  if (typeof mod.createTheme !== 'function' || typeof mod.Button !== 'function') {
    throw new Error('ESM import from packed tarball failed to expose API');
  }
  for (const name of [
    'Inline',
    'Grid',
    'Center',
    'Container',
    'Separator',
    'containerBreakpoints',
  ]) {
    if (mod[name] === undefined) {
      throw new Error(`Packed ESM missing Stage 1 export: ${name}`);
    }
  }

  const js = readFileSync(
    join(fixture, 'node_modules/@reactive/silk/dist/index.js'),
    'utf8',
  );
  for (const banned of ['styled(', 'createGlobalStyle']) {
    if (js.includes(banned)) {
      throw new Error(`Runtime style generation marker found: ${banned}`);
    }
  }

  console.log('packed-consumer-check: OK');
} finally {
  rmSync(fixture, { recursive: true, force: true });
  for (const f of ['silk-core.tgz', 'silk.tgz']) {
    try {
      rmSync(join(root, f), { force: true });
    } catch {
      /* ignore */
    }
  }
}
