import { expect, test } from '@rstest/core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Not yet moved; delete each entry as its file moves to Reanimated (`Switch`:
 * the PR that makes it drag).
 */
const unmoved = new Set(['components/Switch.tsx']);

// docs/PRINCIPLES.md: animations run on the UI thread. React Native's
// `Animated` does only with its native driver, and on the web it steps every
// frame in JavaScript, so silk-native animates with Reanimated alone.
test("nothing animates with React Native's Animated", () => {
  const root = import.meta.dirname;
  const users = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .filter((file) => !unmoved.has(file.split(path.sep).join('/')))
    .filter((file) =>
      /import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from\s*'react-native'/.test(
        readFileSync(path.join(root, file), 'utf8'),
      ),
    );
  expect(users).toEqual([]);
});
