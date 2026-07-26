import { mediaScale, mediaScaleSizes } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { loadDistCss } from '../test/distCss';

const escapeRe = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function avatarClassName(css: string): string {
  const match = css.match(
    /\.([a-zA-Z0-9_-]+)\s*\{[^}]*--silk-avatar-size/,
  );
  expect(match).not.toBeNull();
  return match![1];
}

test('Avatar size is density-proof fixed px from mediaScale', () => {
  const css = loadDistCss();
  const avatarClass = avatarClassName(css);

  for (const size of mediaScaleSizes) {
    const px = `${mediaScale[size].media}px`;
    expect(css).toMatch(
      new RegExp(
        `\\.${escapeRe(avatarClass)}:where\\(\\[data-size="${size}"\\]\\)\\s*\\{[^}]*--_size:\\s*${escapeRe(px)}`,
      ),
    );
  }

  // Size rules must not ride density-remapped space tokens.
  for (const size of mediaScaleSizes) {
    const body = css.match(
      new RegExp(
        `\\.${escapeRe(avatarClass)}:where\\(\\[data-size="${size}"\\]\\)\\s*\\{([^}]+)\\}`,
      ),
    );
    expect(body).not.toBeNull();
    expect(body![1]).not.toContain('--silk-space-');
  }

  const base = css.match(
    new RegExp(`\\.${escapeRe(avatarClass)}\\s*\\{([^}]+)\\}`),
  );
  expect(base).not.toBeNull();
  expect(base![1]).toContain('var(--silk-avatar-size,');
  expect(base![1]).toMatch(
    /font-size:\s*calc\(var\(--_resolved-size\)\s*\*\s*\.?4\)/,
  );
  expect(base![1]).not.toContain('--silk-typography-label-size');
});
