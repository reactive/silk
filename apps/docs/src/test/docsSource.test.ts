import { describe, expect, test } from '@rstest/core';

/**
 * Story files that import local composition helpers must attach that source via
 * docsSource helpers so the Storybook code panel stays reproducible.
 */
const storySources = import.meta.glob('../**/*.stories.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const fixtureModules = import.meta.glob('../fixtures/*.{ts,tsx}', {
  eager: true,
});

const fixtureNames = new Set(
  Object.keys(fixtureModules)
    .map((path) => path.match(/\/([^/]+)\.tsx?$/)?.[1])
    .filter((name): name is string =>
      Boolean(name && !name.includes('.stories') && !name.includes('.test')),
    ),
);

function codeWithoutImports(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*import\b/.test(line))
    .join('\n');
}

function importedHelpers(source: string): string[] {
  const helpers: string[] = [];
  const fromRe =
    /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  for (const match of source.matchAll(fromRe)) {
    const spec = match[1]!;
    if (spec.endsWith('.demo') || spec.endsWith('.demo.tsx')) {
      helpers.push(spec.replace(/\.tsx$/, ''));
      continue;
    }
    if (
      spec === '../VariantMatrix' ||
      spec === '../VariantMatrix.tsx' ||
      spec.endsWith('/VariantMatrix')
    ) {
      helpers.push('VariantMatrix');
      continue;
    }
    if (
      spec === '../surfacePanel' ||
      spec === '../surfacePanel.tsx' ||
      spec.endsWith('/surfacePanel')
    ) {
      helpers.push('surfacePanel');
      continue;
    }
    const fixture = spec.match(/^\.\/([^/.]+)$/)?.[1];
    if (fixture && fixtureNames.has(fixture)) {
      helpers.push(fixture);
    }
  }
  return helpers;
}

function hasAttachmentFor(helper: string, source: string, body: string): boolean {
  if (helper === 'VariantMatrix') {
    return /\.\.\.matrixSource\b|\bparameters:\s*matrixSource\b/.test(body);
  }
  const base = helper.replace(/^\.\.?\//, '').replace(/\.demo$/, '');
  const rawForHelper = new RegExp(
    `${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.demo)?\\.tsx\\?raw`,
  );
  return (
    /\bwithSource\s*\(/.test(body) &&
    rawForHelper.test(source)
  );
}

describe('story show-code transparency', () => {
  for (const [path, source] of Object.entries(storySources)) {
    test(`${path} attaches docs source for each local helper import`, () => {
      const helpers = importedHelpers(source);
      if (helpers.length === 0) {
        return;
      }
      const body = codeWithoutImports(source);
      for (const helper of helpers) {
        expect(
          hasAttachmentFor(helper, source, body),
          `${path} imports ${helper} but does not attach its source via withSource / matrixSource`,
        ).toBe(true);
      }
    });
  }
});
