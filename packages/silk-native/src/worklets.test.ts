import { type NodePath, parseSync, transformSync, traverse, types as t } from '@babel/core';
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

/**
 * Anything an import can be: every property, call and construction gives itself back. A
 * function, not an arrow, so a class can extend it (React's `Component`).
 */
const anything: unknown = new Proxy(function () {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => '' : anything),
  apply: () => anything,
  construct: () => anything as object,
});

// Apps (and their tests) compile silk-native with the worklets Babel plugin, which these
// tests otherwise skip. Its output can fail where the plain source runs: it throws on a spread
// in the object a gesture hook takes, and turns each worklet into a value that captures what
// it reads when defined, so a module-level worklet reading a declaration below it throws as
// the module loads. Each module runs here as the plugin leaves it, its imports stood in for.
test('every module loads as the worklets plugin compiles it', () => {
  const failed: string[] = [];
  for (const { file, text } of sources()) {
    try {
      const { code } = transformSync(text, {
        filename: file,
        babelrc: false,
        configFile: false,
        presets: ['@babel/preset-typescript', ['@babel/preset-react', { runtime: 'automatic' }]],
        plugins: ['react-native-worklets/plugin', '@babel/plugin-transform-modules-commonjs'],
      })!;
      const module = { exports: {} };
      new Function('require', 'module', 'exports', code!)(() => anything, module, module.exports);
    } catch (error) {
      failed.push(`${path.basename(file)}: ${(error as Error).message.split('\n')[0]}`);
    }
  }
  expect(failed).toEqual([]);
});
