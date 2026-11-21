import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@rstest/core';

test('the color module imports nothing outside its folder', () => {
  const folder = new URL('./', import.meta.url);
  for (const file of readdirSync(folder)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    const source = readFileSync(new URL(file, folder), 'utf8');
    const specifiers = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;
    for (const [, from] of source.matchAll(specifiers)) {
      expect([file, from!.startsWith('./')]).toEqual([file, true]);
    }
  }
});
