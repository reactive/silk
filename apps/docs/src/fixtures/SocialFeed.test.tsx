import { SilkProvider } from '@reactive/silk';
import { expect, test } from '@rstest/core';
import { render, within } from '@testing-library/react';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { SocialFeed, type SocialFeedState } from './SocialFeed';

const states: SocialFeedState[] = [
  'normal',
  'loading',
  'empty',
  'error',
  'longThread',
  'narrow',
  'reducedMotion',
];

function renderFixture(state: SocialFeedState) {
  return render(
    <SilkProvider colorScheme="light">
      <SocialFeed state={state} />
    </SilkProvider>,
  );
}

test.each(states)(
  'SocialFeed state "%s" mounts with fixture markers',
  (state) => {
    const { container } = renderFixture(state);
    const root = container.querySelector('[data-fixture="social-feed"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-fixture-state')).toBe(state);
    expect(within(root as HTMLElement).getByText('Social feed')).toBeTruthy();
  },
);

test('loading state uses FeedItem skeletons', () => {
  const { container } = renderFixture('loading');
  const region = container.querySelector('[data-region="loading"]');
  expect(region).not.toBeNull();
  expect(
    within(region as HTMLElement).getAllByLabelText('Loading feed item').length,
  ).toBeGreaterThanOrEqual(2);
});

test('empty and error states render EmptyState regions', () => {
  const empty = renderFixture('empty');
  expect(
    empty.container.querySelector('[data-region="empty"]'),
  ).not.toBeNull();
  expect(empty.getByText('No posts yet')).toBeTruthy();

  const error = renderFixture('error');
  expect(
    error.container.querySelector('[data-region="error"]'),
  ).not.toBeNull();
  expect(error.getByText('Couldn’t load the feed')).toBeTruthy();
});

test('longThread includes nested comments', () => {
  const { container } = renderFixture('longThread');
  const region = container.querySelector(
    '[data-region="long-thread"]',
  ) as HTMLElement;
  expect(within(region).getByText(/Starting a long thread/)).toBeTruthy();
  expect(
    within(region).getAllByText(/punch-card loom|carry chain|depth/).length,
  ).toBeGreaterThanOrEqual(3);
});

test('reducedMotion mocks matchMedia', () => {
  setPrefersReducedMotion(true);
  const { container } = renderFixture('reducedMotion');
  expect(
    container.querySelector('[data-region="reduced-motion"]'),
  ).not.toBeNull();
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(
    true,
  );
});
