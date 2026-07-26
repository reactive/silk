import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = join(docsRoot, 'storybook-static');
const serveRoot = join(docsRoot, '.storybook-serve');
const port = process.env.STORYBOOK_TEST_PORT ?? '6006';
const url = `http://127.0.0.1:${port}/silk/`;

rmSync(serveRoot, { recursive: true, force: true });
mkdirSync(serveRoot, { recursive: true });
symlinkSync(staticDir, join(serveRoot, 'silk'), 'dir');

// Production builds use assetPrefix `/silk/`; serve that path so the iframe loads.
const serveCmd = `http-server ${JSON.stringify(serveRoot)} -a 127.0.0.1 -p ${port} --silent`;
const testCmd = `wait-on -t 30000 ${JSON.stringify(url)} && test-storybook --ci --url ${JSON.stringify(url)}`;

const result = spawnSync(
  'concurrently',
  ['-k', '-s', 'first', '-n', 'serve,test', serveCmd, testCmd],
  { stdio: 'inherit', cwd: docsRoot },
);

rmSync(serveRoot, { recursive: true, force: true });
process.exit(result.status ?? 1);
