import { type NodePath, parseSync, traverse, types as t } from '@babel/core';
import { expect, test } from '@rstest/core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Every non-test source file in silk-native and silk-core, with its text. */
function sources(): { file: string; text: string }[] {
  const roots = ['.', '../../silk-core/src'].map((root) => path.resolve(import.meta.dirname, root));
  return roots.flatMap((root) =>
    readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .map((file) => path.join(root, file))
      .map((file) => ({ file, text: readFileSync(file, 'utf8') })),
  );
}

const isWorklet = (fn: NodePath<t.Function>) =>
  t.isBlockStatement(fn.node.body) &&
  fn.node.body.directives.some((directive) => directive.value.value === 'worklet');

// The jsdom tests run worklets as plain functions. On the UI thread a worklet
// binds what it captured (module constants, imports) in its body, after its
// parameter defaults run, so a default that reads one throws there.
test('no worklet reads a captured value in a parameter default', () => {
  let worklets = 0;
  const early: string[] = [];
  for (const { file, text } of sources()) {
    if (!text.includes("'worklet'")) continue;
    const ast = parseSync(text, {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: ['@babel/preset-typescript'],
    });
    traverse(ast!, {
      Function(fn) {
        if (!isWorklet(fn)) return;
        worklets++;
        for (const param of fn.get('params')) {
          param.traverse({
            ReferencedIdentifier(id) {
              const binding = id.scope.getBinding(id.node.name);
              const inDefault = id.findParent((parent) => parent.isAssignmentPattern());
              if (inDefault && binding && !binding.path.isDescendant(fn)) {
                early.push(`${path.basename(file)}: ${id.node.name}`);
              }
            },
          });
        }
      },
    });
  }
  expect(worklets).toBeGreaterThan(0);
  expect(early).toEqual([]);
});

// The worklets Babel plugin turns a worklet into a value that captures what it
// reads when it is defined. A module-level worklet that reads a function or
// constant declared below it throws while its module loads (on the UI thread
// and in the app's own tests), though the jsdom tests here run it fine.
test('no module-level worklet reads a declaration below it', () => {
  let worklets = 0;
  const early: string[] = [];
  for (const { file, text } of sources()) {
    if (!text.includes("'worklet'")) continue;
    const ast = parseSync(text, {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: ['@babel/preset-typescript'],
    });
    traverse(ast!, {
      Function(fn) {
        if (!isWorklet(fn) || fn.getFunctionParent()) return;
        worklets++;
        fn.get('body').traverse({
          ReferencedIdentifier(id) {
            const binding = id.scope.getBinding(id.node.name);
            if (binding?.scope.path.isProgram() && binding.path.node.start! > fn.node.start!) {
              early.push(`${path.basename(file)}: ${id.node.name}`);
            }
          },
        });
      },
    });
  }
  expect(worklets).toBeGreaterThan(0);
  expect(early).toEqual([]);
});

// The same plugin adds 'worklet' to each callback of the object a gesture hook
// takes, written into its call or in a constant the call names, and throws on a
// spread there; `panAlong` merges a config for that reason.
test('no object written into a gesture hook call spreads', () => {
  let hooks = 0;
  const spread: string[] = [];
  for (const { file, text } of sources()) {
    if (!/use[A-Za-z]*Gesture\(/.test(text)) continue;
    const ast = parseSync(text, {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-typescript', { isTSX: file.endsWith('.tsx'), allExtensions: true }]],
    });
    traverse(ast!, {
      CallExpression(call) {
        const { callee } = call.node;
        if (!t.isIdentifier(callee) || !/^use[A-Za-z]+Gesture$/.test(callee.name)) return;
        hooks++;
        for (const arg of call.get('arguments')) {
          const named = arg.isIdentifier() ? arg.scope.getBinding(arg.node.name)?.path : undefined;
          const object = named?.isVariableDeclarator() ? named.node.init : arg.node;
          if (t.isObjectExpression(object) && object.properties.some((p) => t.isSpreadElement(p))) {
            spread.push(`${path.basename(file)}: ${callee.name}`);
          }
        }
      },
    });
  }
  expect(hooks).toBeGreaterThan(0);
  expect(spread).toEqual([]);
});
