import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { MediaObject } from './MediaObject';

test('MediaObject convenience renders media beside content', () => {
  render(
    <MediaObject media={<span>Media</span>}>
      Content body
    </MediaObject>,
  );
  expect(screen.getByText('Media')).toBeTruthy();
  expect(screen.getByText('Content body')).toBeTruthy();
});

test('MediaObject mediaPosition end sets row-reverse', () => {
  const { container } = render(
    <MediaObject media={<span>M</span>} mediaPosition="end">
      C
    </MediaObject>,
  );
  expect(
    container.querySelector('[data-direction="row-reverse"]'),
  ).not.toBeNull();
});

test('MediaObject has no axe violations', async () => {
  const { container } = render(
    <MediaObject media={<span>Media</span>}>Content</MediaObject>,
  );
  await expectNoAxeViolations(container);
});
