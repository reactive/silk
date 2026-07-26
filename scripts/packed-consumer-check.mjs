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

  const js = readFileSync(
    join(fixture, 'node_modules/@reactive/silk/dist/index.js'),
    'utf8',
  );
  // `styled(` catches the `@linaria/react` wrapper runtime, excluded for the
  // reasons in PRINCIPLES (cross-platform variants, prop filtering, tree cost)
  // rather than because it generates CSS at runtime — it does not.
  // `createGlobalStyle` catches styled-components creeping in.
  for (const banned of ['styled(', 'createGlobalStyle']) {
    if (js.includes(banned)) {
      throw new Error(`Banned styling runtime marker found: ${banned}`);
    }
  }

  // Declaration surface: compile a TS consumer against packed .d.ts so missing
  // prop types / compound parts fail CI (runtime export checks alone won't).
  writeFileSync(
    join(fixture, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          jsx: 'react-jsx',
          strict: true,
          exactOptionalPropertyTypes: true,
          skipLibCheck: true,
          noEmit: true,
          types: ['react', 'react-dom'],
        },
        include: ['consumer.tsx'],
      },
      null,
      2,
    ),
  );
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
  run(`npx tsc -p ${join(fixture, 'tsconfig.json')}`, fixture);

  console.log('packed-consumer-check: OK');
} finally {
  rmSync(fixture, { recursive: true, force: true });
  for (const f of ['silk-core.tgz', 'silk.tgz']) {
    rmSync(join(root, f), { force: true });
  }
}
