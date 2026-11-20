import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';

test('refs are typed as the host element, not the component', () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const self = path.join('components', 'refTypes.test.ts');
  const files = (readdirSync(src, { recursive: true }) as string[]).filter(
    (f) => /\.tsx?$/.test(f) && f !== self,
  );
  // On React Native 0.88 View, Text and TextInput are function components, so
  // Ref<View> is a ref to the function and hides .focus() and .measureInWindow().
  // CI type-checks against an older React Native, where the old spelling still
  // passes, so this guard catches it. Write ComponentRef<typeof View> instead.
  const component =
    /\b(?:Ref|RefObject|useRef|createRef)<\s*(?:View|RNText|Text|TextInput)\b|\b(?:View|RNText|Text|TextInput)\s*\|\s*null\b/;
  const offenders = files.filter((f) => component.test(readFileSync(path.join(src, f), 'utf8')));
  expect(offenders).toEqual([]);
});
