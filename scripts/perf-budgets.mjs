#!/usr/bin/env node
/**
 * Performance budgets for @reactive/silk and @reactive/silk-native.
 *
 * - JS: virtual consumer entries (one named export each) bundled with esbuild,
 *   minified + gzip. Reports isolated per-component cost and a shared baseline
 *   separately — never sum isolated sizes (shared chunks would double-count).
 * - CSS: package-wide dist/index.css total (hard budget). Native has no CSS.
 * - SSR: renderToString median timing — informational only (CI is noisy).
 *   Native runtime SSR is N/A.
 *
 * Usage: node scripts/perf-budgets.mjs [--write]
 *   --write  overwrite perf-budgets.json measured field from current build
 */
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const silkDist = join(root, 'packages/silk/dist');
const silkEntry = join(silkDist, 'index.js');
const nativeEntry = join(root, 'packages/silk-native/dist/index.js');
const nativeSourceEntry = join(root, 'packages/silk-native/src/index.ts');
const cssPath = join(silkDist, 'index.css');
const budgetPath = join(root, 'perf-budgets.json');
const write = process.argv.includes('--write');

function gzipBytes(buf) {
  return gzipSync(buf).length;
}

async function measureIsolatedJs(
  exportName,
  tmpDir,
  {
    entryPath = silkEntry,
    external = ['react', 'react-dom', 'react/jsx-runtime'],
    prefix = '',
  } = {},
) {
  const entry = join(tmpDir, `${prefix}${exportName}.entry.mjs`);
  writeFileSync(
    entry,
    `import { ${exportName} } from ${JSON.stringify(entryPath)};\nexport { ${exportName} };\n`,
  );
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    outfile: join(tmpDir, `${prefix}${exportName}.bundle.js`),
    write: false,
    // Keep React (and RN for native) external — consumer already has them.
    external,
    logLevel: 'silent',
  });
  const raw = result.outputFiles[0].contents;
  return { raw: raw.length, gzip: gzipBytes(raw) };
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

/**
 * Component exports are the source of truth. A new native component must add a
 * budget in the same PR; stale budgets must be removed with deleted exports.
 */
function nativeComponentExports() {
  const source = readFileSync(nativeSourceEntry, 'utf8');
  const names = new Set();
  const componentExport =
    /export\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/components\/([^'"]+)\.js['"];?/g;
  for (const match of source.matchAll(componentExport)) {
    const componentName = basename(match[2]);
    const exportedNames = match[1]
      .split(',')
      .map((name) => name.trim().split(/\s+as\s+/).at(-1));
    if (!exportedNames.includes(componentName)) {
      throw new Error(
        `Native component module ${componentName} does not export ${componentName}`,
      );
    }
    names.add(componentName);
  }
  return [...names].sort();
}

function assertNativeBudgetCoverage(nativeBudgets) {
  const components = nativeComponentExports();
  const budgetNames = Object.keys(nativeBudgets).sort();
  const missing = components.filter((name) => !nativeBudgets[name]);
  const stale = budgetNames.filter((name) => !components.includes(name));
  if (missing.length || stale.length) {
    throw new Error(
      [
        missing.length
          ? `missing native component budgets: ${missing.join(', ')}`
          : '',
        stale.length ? `stale native component budgets: ${stale.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }
}

function fail(msg) {
  console.error(`perf-budgets: FAIL — ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const tmpDir = join(root, 'scripts/.perf-tmp');
  const budgetFile = loadBudgets();
  const { budgets } = budgetFile;
  const components = Object.keys(budgets.isolatedGzip);
  assertNativeBudgetCoverage(budgets.nativeIsolatedGzip);
  const nativeComponents = Object.keys(budgets.nativeIsolatedGzip);
  mkdirSync(tmpDir, { recursive: true });
  try {
    const css = measureCss();
    const [baseline, isolatedEntries, nativeIsolatedEntries] =
      await Promise.all([
        // createTheme import measures the shared core+theme baseline.
        measureIsolatedJs('createTheme', tmpDir),
        Promise.all(
          components.map(async (name) => [
            name,
            await measureIsolatedJs(name, tmpDir),
          ]),
        ),
        Promise.all(
          nativeComponents.map(async (name) => [
            name,
            await measureIsolatedJs(name, tmpDir, {
              entryPath: nativeEntry,
              external: ['react', 'react/jsx-runtime', 'react-native'],
              prefix: 'native-',
            }),
          ]),
        ),
      ]);
    const isolated = Object.fromEntries(isolatedEntries);
    const nativeIsolated = Object.fromEntries(nativeIsolatedEntries);
    const ssr = await measureSsr();

    const measured = {
      generatedAt: new Date().toISOString(),
      sharedBaselineGzip: baseline.gzip,
      css,
      isolated,
      nativeIsolated,
      ssr,
    };

    console.log('perf-budgets: measured');
    console.log(`  shared baseline (createTheme) gzip: ${baseline.gzip} B`);
    console.log(`  CSS raw/gzip: ${css.raw} / ${css.gzip} B`);
    for (const name of components) {
      console.log(
        `  ${name.padEnd(14)} gzip: ${isolated[name].gzip} B (raw ${isolated[name].raw})`,
      );
    }
    console.log('  native (react + react-native external; CSS N/A):');
    for (const name of nativeComponents) {
      console.log(
        `  native ${name.padEnd(8)} gzip: ${nativeIsolated[name].gzip} B (raw ${nativeIsolated[name].raw})`,
      );
    }
    console.log(`  SSR median (informational): ${ssr.medianMs} ms`);

    if (write) {
      const next = { ...budgetFile, measured };
      writeFileSync(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`perf-budgets: wrote ${budgetPath}`);
    } else {
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
      for (const name of components) {
        const max = budgets.isolatedGzip[name];
        if (max == null) {
          fail(`missing isolatedGzip budget for ${name}`);
          continue;
        }
        if (isolated[name].gzip > max) {
          fail(`${name} gzip ${isolated[name].gzip} > budget ${max}`);
        }
      }
      for (const name of nativeComponents) {
        const max = budgets.nativeIsolatedGzip[name];
        if (max == null) {
          fail(`missing nativeIsolatedGzip budget for ${name}`);
          continue;
        }
        if (nativeIsolated[name].gzip > max) {
          fail(`native ${name} gzip ${nativeIsolated[name].gzip} > budget ${max}`);
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
