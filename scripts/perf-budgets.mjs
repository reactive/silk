#!/usr/bin/env node
/**
 * Performance budgets for @reactive/silk.
 *
 * - JS: virtual consumer entries (one named export each) bundled with esbuild,
 *   minified + gzip. Reports isolated per-component cost and a shared baseline
 *   separately — never sum isolated sizes (shared chunks would double-count).
 * - CSS: package-wide dist/index.css total (hard budget).
 * - SSR: renderToString median timing — informational only (CI is noisy).
 *
 * Usage: node scripts/perf-budgets.mjs [--write]
 *   --write  overwrite perf-budgets.json measured field from current build
 */
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const silkDist = join(root, 'packages/silk/dist');
const silkEntry = join(silkDist, 'index.js');
const cssPath = join(silkDist, 'index.css');
const budgetPath = join(root, 'perf-budgets.json');
const write = process.argv.includes('--write');

const COMPONENTS = [
  'Button',
  'Dialog',
  'Tooltip',
  'Popover',
  'DropdownMenu',
  'Select',
  'Tabs',
  'Accordion',
  'Toggle',
  'ToggleGroup',
  'ScrollArea',
  'Toast',
];

function gzipBytes(buf) {
  return gzipSync(buf).length;
}

async function measureIsolatedJs(exportName, tmpDir) {
  const entry = join(tmpDir, `${exportName}.entry.mjs`);
  writeFileSync(
    entry,
    `import { ${exportName} } from ${JSON.stringify(silkEntry)};\nexport { ${exportName} };\n`,
  );
  const outfile = join(tmpDir, `${exportName}.bundle.js`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    outfile,
    // Keep React external — consumer already has it; we measure Silk cost.
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    logLevel: 'silent',
  });
  const raw = readFileSync(outfile);
  return { raw: raw.length, gzip: gzipBytes(raw) };
}

async function measureBaseline(tmpDir) {
  // createTheme import measures shared core+theme baseline from the monolith.
  return measureIsolatedJs('createTheme', tmpDir);
}

function measureCss() {
  const raw = readFileSync(cssPath);
  return { raw: raw.length, gzip: gzipBytes(raw) };
}

async function measureSsr() {
  const silk = await import(pathToFileURL(silkEntry).href);
  const tree = createElement(
    silk.SilkProvider,
    null,
    createElement(silk.Button, null, 'Go'),
    createElement(
      silk.Tabs.Root,
      { defaultValue: 'a' },
      createElement(
        silk.Tabs.List,
        null,
        createElement(silk.Tabs.Trigger, { value: 'a' }, 'A'),
      ),
      createElement(silk.Tabs.Content, { value: 'a' }, 'Panel'),
    ),
    createElement(silk.Toggle, { 'aria-label': 'X' }, 'X'),
  );

  // Warmup
  for (let i = 0; i < 20; i++) renderToString(tree);

  const samples = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    renderToString(tree);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  return { medianMs: Number(median.toFixed(3)) };
}

function loadBudgets() {
  return JSON.parse(readFileSync(budgetPath, 'utf8'));
}

function fail(msg) {
  console.error(`perf-budgets: FAIL — ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const tmpDir = join(root, 'scripts/.perf-tmp');
  mkdirSync(tmpDir, { recursive: true });
  try {
    const css = measureCss();
    const [baseline, ...isolatedEntries] = await Promise.all([
      measureBaseline(tmpDir),
      ...COMPONENTS.map(async (name) => [
        name,
        await measureIsolatedJs(name, tmpDir),
      ]),
    ]);
    const isolated = Object.fromEntries(isolatedEntries);
    const ssr = await measureSsr();

    const measured = {
      generatedAt: new Date().toISOString(),
      sharedBaselineGzip: baseline.gzip,
      css,
      isolated,
      ssr,
    };

    console.log('perf-budgets: measured');
    console.log(`  shared baseline (createTheme) gzip: ${baseline.gzip} B`);
    console.log(`  CSS raw/gzip: ${css.raw} / ${css.gzip} B`);
    for (const name of COMPONENTS) {
      console.log(
        `  ${name.padEnd(14)} gzip: ${isolated[name].gzip} B (raw ${isolated[name].raw})`,
      );
    }
    console.log(`  SSR median (informational): ${ssr.medianMs} ms`);

    if (write) {
      const existing = loadBudgets();
      const next = {
        ...existing,
        measured,
        budgets: existing.budgets,
      };
      writeFileSync(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`perf-budgets: wrote ${budgetPath}`);
    } else {
      const { budgets } = loadBudgets();
      if (css.gzip > budgets.cssGzip) {
        fail(`CSS gzip ${css.gzip} > budget ${budgets.cssGzip}`);
      }
      if (css.raw > budgets.cssRaw) {
        fail(`CSS raw ${css.raw} > budget ${budgets.cssRaw}`);
      }
      if (baseline.gzip > budgets.sharedBaselineGzip) {
        fail(
          `shared baseline gzip ${baseline.gzip} > budget ${budgets.sharedBaselineGzip}`,
        );
      }
      for (const name of COMPONENTS) {
        const max = budgets.isolatedGzip[name];
        if (max == null) {
          fail(`missing isolatedGzip budget for ${name}`);
          continue;
        }
        if (isolated[name].gzip > max) {
          fail(`${name} gzip ${isolated[name].gzip} > budget ${max}`);
        }
      }
      if (ssr.medianMs > budgets.ssrMedianMsSoft) {
        console.warn(
          `perf-budgets: WARN — SSR median ${ssr.medianMs} ms > soft ceiling ${budgets.ssrMedianMsSoft} ms (not enforced)`,
        );
      }
    }

    if (process.exitCode) {
      process.exit(process.exitCode);
    }
    console.log('perf-budgets: OK');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
