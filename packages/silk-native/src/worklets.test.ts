import { transformSync } from '@babel/core';
import { expect, test } from '@rstest/core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Every source file in silk-native and silk-core that holds a worklet. */
function workletSources(): string[] {
  const roots = ['.', '../../silk-core/src'].map((root) => path.resolve(import.meta.dirname, root));
  return roots.flatMap((root) =>
    readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .map((file) => path.join(root, file))
      .filter((file) => readFileSync(file, 'utf8').includes("'worklet'")),
  );
}

// The jsdom tests run worklets as plain functions, so this checks what the
// worklets Babel plugin makes of them, as an app's build does.
test('no worklet reads a captured value in a parameter default', () => {
  const files = workletSources();
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const { code } = transformSync(readFileSync(file, 'utf8'), {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: ['@babel/preset-typescript'],
      plugins: ['react-native-worklets/plugin'],
    })!;
    // On the UI thread a worklet binds what it captured in its body, after its defaults run.
    for (const [, params, captured] of code!.matchAll(
      /code: "\(function \w+\((.*?)\)\{const\{([^}]*)\}=this\.__closure;/g,
    )) {
      const early = captured!
        .split(',')
        .filter((name) => new RegExp(`=[^,{}]*\\b${name}\\b`).test(params!));
      expect(early, file).toEqual([]);
    }
  }
});
