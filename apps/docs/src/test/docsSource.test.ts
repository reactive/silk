import { describe, expect, test } from '@rstest/core';

/**
 * Story files that import local composition helpers (fixtures, demos,
 * VariantMatrix, surfacePanel) must attach that source via docsSource helpers
 * so the Storybook code panel stays reproducible.
 */
const storySources = import.meta.glob('../**/*.stories.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const localHelperImport =
  /from\s+['"](\.\.?\/(?:[^'"]+\.demo|VariantMatrix|surfacePanel)|\.\/(?:SocialFeed|InspectorPanel|AppSkeleton|SettingsForm))(?:\.tsx)?['"]/;

/** Body without import/export-from lines — so import names alone do not pass. */
function codeWithoutImports(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*import\b/.test(line))
    .join('\n');
}

const usesMatrixSource = /\.\.\.matrixSource\b|\bparameters:\s*matrixSource\b/;
const usesWithSource = /\b(?:withSource|withStaticSource)\s*\(/;
const hasRawAttachment = /\?raw['"]/;

describe('story show-code transparency', () => {
  for (const [path, source] of Object.entries(storySources)) {
    test(`${path} attaches docs source when it imports local helpers`, () => {
      if (!localHelperImport.test(source)) {
        return;
      }
      const body = codeWithoutImports(source);
      // matrixSource already embeds VariantMatrix.tsx?raw; other helpers need a
      // local ?raw import passed into withSource / withStaticSource.
      const ok =
        usesMatrixSource.test(body) ||
        (usesWithSource.test(body) && hasRawAttachment.test(source));
      expect(
        ok,
        `${path} imports a local helper/fixture but does not call withSource / withStaticSource / matrixSource with a ?raw attachment`,
      ).toBe(true);
    });
  }
});
