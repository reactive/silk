#!/usr/bin/env node
/**
 * Packed-consumer check: pack packages, install into a temp fixture,
 * verify CSS lands, ESM import works, and no runtime style-generation markers ship.
 * Also packs @reactive/silk-native and verifies an RNW-aliased esbuild consumer.
 */
import { execSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(join(tmpdir(), 'silk-packed-'));

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function listFiles(dir, matches = () => true) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && matches(e.name))
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

const isJs = (name) => name.endsWith('.js');
const isTest = (name) => /\.test\./.test(name);

/**
 * Typecheck `<name>.tsx` against the packed .d.ts so missing prop types or
 * compound parts fail CI (runtime export checks alone won't).
 */
function checkConsumerTypes(name, compilerOptions) {
  const config = join(fixture, `tsconfig.${name}.json`);
  writeFileSync(
    config,
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          ...compilerOptions,
        },
        include: [`${name}.tsx`],
      },
      null,
      2,
    ),
  );
  run(`npx tsc -p ${config}`, fixture);
}

/** Linaria class selectors in the aggregate stylesheet. */
function cssClassNames(css) {
  const names = new Set();
  for (const m of css.matchAll(
    /(?:^|[,}\s])\.([a-zA-Z_][\w-]*)(?=[\s:{,.[#+>~])/gm,
  )) {
    names.add(m[1]);
  }
  return names;
}

/**
 * Assert every Linaria class in CSS is referenced from some emitted JS file
 * and vice versa — catches the bundleless JS pass and the CSS-only pass
 * silently diverging (wyw class names are path-derived, so matching names
 * alone do not prove matching declarations; missing names still catch drift).
 */
function assertClassNameParity(distDir, css) {
  const cssNames = cssClassNames(css);
  if (cssNames.size === 0) {
    throw new Error('Packed CSS contains no class selectors');
  }

  const jsNames = new Set();
  const stringLit = /["']([a-zA-Z_][\w-]{2,})["']/g;
  for (const file of listFiles(distDir, isJs)) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(stringLit)) {
      if (cssNames.has(m[1])) {
        jsNames.add(m[1]);
      }
    }
  }

  const onlyCss = [...cssNames].filter((n) => !jsNames.has(n)).sort();
  if (onlyCss.length) {
    throw new Error(
      `CSS classes missing from emitted JS (two-pass drift?): ${onlyCss.join(', ')}`,
    );
  }
}

try {
  run('yarn workspace @reactive/silk-core build');
  run('yarn workspace @reactive/silk build');
  run('yarn workspace @reactive/silk-native build');

  run('yarn workspace @reactive/silk-core pack --out ../../silk-core.tgz');
  run('yarn workspace @reactive/silk pack --out ../../silk.tgz');
  run('yarn workspace @reactive/silk-native pack --out ../../silk-native.tgz');

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
          '@reactive/silk-native': `file:${join(root, 'silk-native.tgz')}`,
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'react-native-web': '~0.21.0',
          typescript: '~5.9.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
        },
      },
      null,
      2,
    ),
  );

  run('npm install --ignore-scripts', fixture);

  const nativePkg = JSON.parse(
    readFileSync(
      join(fixture, 'node_modules/@reactive/silk-native/package.json'),
      'utf8',
    ),
  );
  const workspaceDeps = Object.entries(nativePkg.dependencies).filter(
    ([, range]) => range.startsWith('workspace:'),
  );
  if (workspaceDeps.length) {
    throw new Error(
      `Packed @reactive/silk-native still declares workspace: ranges: ${workspaceDeps
        .map(([name]) => name)
        .join(', ')}`,
    );
  }

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
    '--silk-color-surface-sunken',
    '--silk-color-overlay',
    '--silk-shadow-raised',
    '--silk-color-tone-success-solid',
    '--silk-space-compact-2',
    '--silk-space-comfortable-2',
    '--silk-font-sans',
    '--silk-font-serif',
    '--silk-font-mono',
    'data-variant',
    'data-density',
    'data-elevation',
    'data-collapse-below',
    '@container',
    'prefers-reduced-motion',
  ]) {
    if (!css.includes(needle)) {
      throw new Error(`Packed CSS missing ${needle}`);
    }
  }

  const layerCssPath = join(
    fixture,
    'node_modules/@reactive/silk/dist/index.layer.css',
  );
  if (!existsSync(layerCssPath)) {
    throw new Error(`Missing layered CSS at ${layerCssPath}`);
  }
  const layerCss = readFileSync(layerCssPath, 'utf8');
  if (layerCss !== `@layer silk {\n${css.trimEnd()}\n}\n`) {
    throw new Error(
      'Layered CSS is not index.css wrapped verbatim in @layer silk',
    );
  }

  const distDir = join(fixture, 'node_modules/@reactive/silk/dist');
  const testArtifacts = listFiles(distDir, isTest);
  if (testArtifacts.length) {
    throw new Error(
      `Test artifacts shipped in package:\n${testArtifacts.join('\n')}`,
    );
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
    'Container',
    'Separator',
    'containerBreakpoints',
    'Surface',
    'Card',
    'Heading',
    'Badge',
    'Skeleton',
    'Spinner',
    'Progress',
    'Field',
    'Input',
    'Textarea',
    'Checkbox',
    'RadioGroup',
    'Switch',
    'Slider',
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
    'cssVars',
    'silkComponentVarNames',
  ]) {
    if (mod[name] === undefined) {
      throw new Error(`Packed ESM missing Stage export: ${name}`);
    }
  }

  const coreEntryUrl = pathToFileURL(
    join(fixture, 'node_modules/@reactive/silk-core/dist/index.js'),
  ).href;
  const coreMod = await import(coreEntryUrl);
  for (const name of [
    'createTheme',
    'surfaceRecipe',
    'inputRecipe',
    'popoverRecipe',
    'tabsRecipe',
    'selectRecipe',
    'toastRecipe',
    'toggleRecipe',
    'defaultShadow',
  ]) {
    if (coreMod[name] === undefined) {
      throw new Error(`Packed core missing export: ${name}`);
    }
  }
  const theme = coreMod.createTheme();
  if (!theme.semantic.color.tones.success || !theme.semantic.shadow.raised) {
    throw new Error('Packed createTheme missing Stage 2 semantic tokens');
  }

  assertClassNameParity(distDir, css);

  // Scan every emitted JS module (index.js is only a barrel after bundleless).
  // `styled(` / `createGlobalStyle` catch forbidden styling runtimes.
  // `wyw-in-js` / `__webpack_require__` catch a broken strip-loader or a
  // reversion to the bundled Rspack-runtime monolith.
  const banned = [
    'styled(',
    'createGlobalStyle',
    'wyw-in-js',
    '__webpack_require__',
  ];
  for (const file of listFiles(distDir, isJs)) {
    const js = readFileSync(file, 'utf8');
    for (const marker of banned) {
      if (js.includes(marker)) {
        throw new Error(
          `Banned marker ${JSON.stringify(marker)} in ${relative(distDir, file)}`,
        );
      }
    }
  }

  writeFileSync(
    join(fixture, 'consumer.tsx'),
    `
import type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionTriggerProps,
  DialogContentProps,
  PopoverContentProps,
  ScrollAreaAssembledProps,
  SelectContentProps,
  SelectRootProps,
  TabsRootProps,
  ToastRootProps,
  ToastViewportProps,
  ToggleGroupRootProps,
  ToggleProps,
  TooltipContentProps,
} from '@reactive/silk';
import {
  Accordion,
  Dialog,
  DropdownMenu,
  Popover,
  ScrollArea,
  Select,
  Tabs,
  Toast,
  Toggle,
  ToggleGroup,
  Tooltip,
} from '@reactive/silk';
import type { JSX } from 'react';

declare const dialogProps: DialogContentProps;
declare const popoverProps: PopoverContentProps;
declare const tooltipProps: TooltipContentProps;
declare const selectRootProps: SelectRootProps;
declare const selectContentProps: SelectContentProps;
declare const tabsProps: TabsRootProps;
declare const accordionItemProps: AccordionItemProps;
declare const accordionTriggerProps: AccordionTriggerProps;
declare const accordionContentProps: AccordionContentProps;
declare const toastRootProps: ToastRootProps;
declare const toastViewportProps: ToastViewportProps;
declare const toggleProps: ToggleProps;
declare const toggleGroupProps: ToggleGroupRootProps;
declare const scrollProps: ScrollAreaAssembledProps;

export function Consumer(): JSX.Element {
  return (
    <>
      <Dialog.Root>
        <Dialog.Content {...dialogProps} />
      </Dialog.Root>
      <Popover.Root>
        <Popover.Content {...popoverProps} />
      </Popover.Root>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Content {...tooltipProps} />
        </Tooltip.Root>
      </Tooltip.Provider>
      <DropdownMenu.Root>
        <DropdownMenu.Content>
          <DropdownMenu.CheckboxItem>
            <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>
            Item
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Select.Root {...selectRootProps}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content {...selectContentProps}>
          <Select.Item value="a">A</Select.Item>
        </Select.Content>
      </Select.Root>
      <Tabs.Root {...tabsProps} defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Panel</Tabs.Content>
      </Tabs.Root>
      <Accordion.Root type="single">
        <Accordion.Item {...accordionItemProps} value="1">
          <Accordion.Header>
            <Accordion.Trigger {...accordionTriggerProps}>T</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content {...accordionContentProps}>C</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
      <Toggle {...toggleProps}>B</Toggle>
      <ToggleGroup.Root {...toggleGroupProps} type="single">
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>
      <ScrollArea {...scrollProps}>
        <p>scroll</p>
      </ScrollArea>
      <Toast.Provider>
        <Toast.Root {...toastRootProps}>
          <Toast.Title>T</Toast.Title>
        </Toast.Root>
        <Toast.Viewport {...toastViewportProps} />
      </Toast.Provider>
    </>
  );
}
`,
  );
  checkConsumerTypes('consumer', {
    exactOptionalPropertyTypes: true,
    types: ['react', 'react-dom'],
  });

  // Native package: declarations + RNW-aliased executed bundle (Node cannot
  // load react-native directly).
  const nativeDist = join(fixture, 'node_modules/@reactive/silk-native/dist');
  if (!existsSync(join(nativeDist, 'index.js'))) {
    throw new Error('Packed silk-native missing dist/index.js');
  }
  const nativeTests = listFiles(nativeDist, isTest);
  if (nativeTests.length) {
    throw new Error(`Native test artifacts shipped:\n${nativeTests.join('\n')}`);
  }

  writeFileSync(
    join(fixture, 'consumer.native.tsx'),
    `
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Field,
  Heading,
  Inline,
  Input,
  Progress,
  RadioGroup,
  Separator,
  SilkProvider,
  Skeleton,
  Spinner,
  Stack,
  StatusDot,
  Surface,
  Switch,
  Text,
  Textarea,
} from '@reactive/silk-native';
import type { JSX } from 'react';

export function NativeConsumer(): JSX.Element {
  return (
    <SilkProvider colorScheme="light" density="comfortable">
      <Box padding="2">
        <Stack gap="2" rail="start">
          <Heading level="2">Native</Heading>
          <Surface elevation="raised" border="subtle">
            <Card padding="3">
              <Inline gap="1" direction="row-reverse">
                <Button tone="accent">Go</Button>
                <Badge tone="success">ok</Badge>
                <StatusDot tone="accent" />
                <Avatar fallback="NT" size="sm" />
              </Inline>
              <Separator />
              <Skeleton shape="text" />
              <Spinner size="sm" />
              <Progress value={40} />
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input />
                <Textarea />
                <Checkbox accessibilityLabel="Agree" />
                <Switch accessibilityLabel="Notify" />
                <RadioGroup.Root>
                  <RadioGroup.Item value="a">A</RadioGroup.Item>
                </RadioGroup.Root>
                <Field.Error>Required</Field.Error>
              </Field.Root>
            </Card>
          </Surface>
        </Stack>
      </Box>
    </SilkProvider>
  );
}
`,
  );
  checkConsumerTypes('consumer.native', {
    types: ['react'],
    paths: { 'react-native': ['./node_modules/react-native-web'] },
  });

  const nativeBundleEntry = join(fixture, 'native-bundle-entry.mjs');
  const nativeBundleOut = join(fixture, 'native-bundle.mjs');
  writeFileSync(
    nativeBundleEntry,
    `
import { createTheme } from '@reactive/silk-core';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Field,
  Heading,
  Inline,
  Input,
  Progress,
  RadioGroup,
  SilkProvider,
  Stack,
  Surface,
  Switch,
  Text,
  mapButtonStyle,
  mapSurfaceStyle,
  mapCheckboxStyle,
  a11yState,
} from '@reactive/silk-native';

const theme = createTheme({ colorScheme: 'light' });
const styles = mapButtonStyle(theme, { variant: 'solid', tone: 'accent' });
if (!styles.view.backgroundColor) {
  throw new Error('mapButtonStyle failed in packed native bundle');
}
const surface = mapSurfaceStyle(theme, { elevation: 'overlay' });
if (surface.backgroundColor !== theme.semantic.color.surfaceRaised) {
  throw new Error('overlay elevation must use surfaceRaised');
}
const checked = mapCheckboxStyle(theme, {}, 'comfortable', { checked: 'indeterminate' });
if (!checked.backgroundColor) {
  throw new Error('mapCheckboxStyle indeterminate failed');
}
const a11y = a11yState({ checked: 'mixed' });
if (a11y['aria-checked'] !== 'mixed') {
  throw new Error('a11yState compat helper failed');
}
const required = [
  Box, Stack, Inline, Text, Button, Surface, Card, Heading,
  Checkbox, Switch, RadioGroup, Field, Input, Progress, SilkProvider,
];
if (required.some((fn) => typeof fn !== 'function' && typeof fn !== 'object')) {
  throw new Error('Packed native missing component exports');
}
if (typeof Field.Root !== 'function' || typeof RadioGroup.Item !== 'function') {
  throw new Error('Packed native missing compound exports');
}
console.log('packed-native-bundle: OK');
`,
  );
  const rnwEntry = join(
    fixture,
    'node_modules/react-native-web/dist/index.js',
  );
  if (!existsSync(rnwEntry)) {
    throw new Error(`react-native-web entry missing at ${rnwEntry}`);
  }
  await esbuild.build({
    entryPoints: [nativeBundleEntry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile: nativeBundleOut,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      'react-native': rnwEntry,
    },
    logLevel: 'silent',
  });
  run(`node ${nativeBundleOut}`, fixture);

  console.log('packed-consumer-check: OK');
} finally {
  rmSync(fixture, { recursive: true, force: true });
  for (const f of ['silk-core.tgz', 'silk.tgz', 'silk-native.tgz']) {
    rmSync(join(root, f), { force: true });
  }
}
