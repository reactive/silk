#!/usr/bin/env node
/**
 * Sync composite sources into registry/<name>/ for consumer-owned installs.
 * Relative Silk imports are rewritten to `@reactive/silk`. Stage 7 finalizes
 * pinning, multi-file graphs, and publish-from-tag semantics.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'packages/silk/src/components');

const COMPOSITES = [
  'Identity',
  'StatusDot',
  'MediaObject',
  'ActionBar',
  'StatGroup',
  'EmptyState',
  'PostCard',
  'Comment',
  'CommentThread',
  'Notification',
  'ProfileCard',
  'SettingsPanel',
  'FeedItem',
];

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function rewriteImports(source) {
  return source
    .replace(
      /from '\.\.\/theme\/[^']+'/g,
      "from '@reactive/silk'",
    )
    .replace(/from '\.\/[^']+'/g, "from '@reactive/silk'");
}

const items = [];

for (const name of COMPOSITES) {
  const kebab = toKebab(name);
  const srcPath = join(componentsDir, `${name}.tsx`);
  const outDir = join(root, 'registry', kebab);
  const outPath = join(outDir, `${kebab}.tsx`);
  mkdirSync(outDir, { recursive: true });
  const banner = `/**\n * ${name} composite — synced from packages/silk/src/components/${name}.tsx\n * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.\n */\n`;
  const body = rewriteImports(readFileSync(srcPath, 'utf8'));
  writeFileSync(outPath, banner + body);

  const deps = ['@reactive/silk'];
  if (body.includes("@reactive/silk-core'") || body.includes('@reactive/silk-core"')) {
    deps.push('@reactive/silk-core');
  }
  if (body.includes("from 'radix-ui'") || body.includes('from "radix-ui"')) {
    deps.push('radix-ui');
  }

  items.push({
    name: kebab,
    type: 'registry:component',
    title: name,
    description: `${name} composite. Built on @reactive/silk primitives — zero Tailwind.`,
    dependencies: deps,
    files: [
      {
        path: `registry/${kebab}/${kebab}.tsx`,
        type: 'registry:component',
      },
    ],
  });
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'silk',
  homepage: 'https://github.com/reactive/silk',
  items,
};

writeFileSync(
  join(root, 'registry.json'),
  `${JSON.stringify(registry, null, 2)}\n`,
);

console.log(`Synced ${COMPOSITES.length} composites into registry/`);
