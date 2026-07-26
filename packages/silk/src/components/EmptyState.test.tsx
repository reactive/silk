import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { loadDistCss } from '../test/distCss';
import { EmptyState } from './EmptyState';

const gapBySize = { sm: '4', md: '5', lg: '6' } as const;
const copyGapBySize = { sm: '1', md: '2', lg: '2' } as const;

test('EmptyState convenience renders title and description', () => {
  render(
    <EmptyState title="Nothing here" description="Try again later" />,
  );
  expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeTruthy();
  expect(screen.getByText('Try again later')).toBeTruthy();
});

test('EmptyState groups copy tighter than the root rhythm', () => {
  for (const size of ['sm', 'md', 'lg'] as const) {
    const { unmount } = render(
      <EmptyState
        size={size}
        title="Nothing here"
        description="Try again later"
        media={<span>◇</span>}
        action={<button type="button">Retry</button>}
      />,
    );
    const root = screen.getByRole('heading', { name: 'Nothing here' })
      .parentElement?.parentElement;
    expect(root?.getAttribute('data-size')).toBe(size);
    expect(root?.getAttribute('data-gap')).toBe(gapBySize[size]);

    const copy = screen.getByRole('heading', { name: 'Nothing here' })
      .parentElement;
    expect(copy?.getAttribute('data-gap')).toBe(copyGapBySize[size]);
    expect(copy?.contains(screen.getByText('Try again later'))).toBe(true);
    expect(Number(copyGapBySize[size])).toBeLessThan(Number(gapBySize[size]));
    unmount();
  }
});

test('EmptyState description measure is an overridable hook', () => {
  const css = loadDistCss();
  expect(css).toContain('var(--silk-empty-state-measure,');
  expect(css).toMatch(
    /max-width:\s*var\(--silk-empty-state-measure,\s*46ch\)/,
  );
});

test('EmptyState.Root centers its own element rather than a wrapper', () => {
  const { container } = render(
    <EmptyState.Root data-testid="root">
      <EmptyState.Title>Nothing here</EmptyState.Title>
    </EmptyState.Root>,
  );

  const root = screen.getByTestId('root');
  expect(container.firstElementChild).toBe(root);
  expect(root.getAttribute('data-align')).toBe('center');
  expect(root.getAttribute('data-justify')).toBe('center');
  expect(root.getAttribute('data-gap')).toBe('5');
});

test('EmptyState.Root asChild renders the consumer element as the root', () => {
  let rootRef: HTMLDivElement | null = null;
  const { container } = render(
    <EmptyState.Root
      asChild
      size="lg"
      className="consumer-root"
      data-testid="root"
      ref={(node) => {
        rootRef = node;
      }}
    >
      <section>
        <EmptyState.Title>Nothing here</EmptyState.Title>
      </section>
    </EmptyState.Root>,
  );

  const root = screen.getByTestId('root');
  expect(root.tagName).toBe('SECTION');
  expect(container.firstElementChild).toBe(root);
  expect(container.querySelector('div')).toBe(null);
  expect(root.className).toContain('consumer-root');
  expect(root.getAttribute('data-size')).toBe('lg');
  expect(root.getAttribute('data-gap')).toBe('6');
  expect(rootRef).toBe(root);
});

test('EmptyState has no axe violations', async () => {
  const { container } = render(<EmptyState title="Empty" />);
  await expectNoAxeViolations(container);
});
