#!/usr/bin/env node
/**
 * Publish entrypoint for changesets/action.
 *
 * When there are no open changesets, the action always invokes `publish`.
 * Before the npm package/org exists (or when NPM_TOKEN is unset), exit 0 so
 * Release stays green from the first commit — required for a bisectable history.
 */
import { spawnSync } from 'node:child_process';

if (!process.env.NPM_TOKEN) {
  console.log(
    'NPM_TOKEN unset; skipping npm publish (version PRs still work when changesets exist).',
  );
  process.exit(0);
}

const result = spawnSync('yarn', ['changeset', 'publish'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
