import axe from 'axe-core';
import { expect } from '@rstest/core';

/**
 * Subset a11y check for jsdom. Cannot validate geometry, contrast under
 * real fonts, or browser accessibility-tree behavior — pair with Storybook
 * a11y for overlays.
 */
export async function expectNoAxeViolations(
  container: HTMLElement,
): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom lacks layout; region landmarks often false-positive in unit trees
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}
