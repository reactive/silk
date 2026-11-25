import { expect, test } from '@rstest/core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// docs/PRINCIPLES.md: animations run on the UI thread. React Native's
// `Animated` does only with its native driver, and on the web it steps every
// frame in JavaScript, so silk-native animates with Reanimated alone.
test("nothing animates with React Native's Animated", () => {
  const root = import.meta.dirname;
  const users = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .filter((file) =>
      /import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from\s*['"]react-native['"]/.test(
        readFileSync(path.join(root, file), 'utf8'),
      ),
    )
    .map((file) => file.split(path.sep).join('/'));
  expect(users).toEqual([]);
});
