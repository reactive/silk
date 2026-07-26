import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Box } from './Box';
import { Container } from './Container';
import { Grid } from './Grid';
import { Inline } from './Inline';
import { Separator } from './Separator';
import { Stack } from './Stack';

test('Box renders padding default and respect provider defaults', () => {
  const { container, rerender } = render(<Box data-testid="box">A</Box>);
  expect(screen.getByTestId('box').getAttribute('data-padding')).toBe('0');

  rerender(
    <SilkProvider defaults={{ Box: { padding: '4' } }}>
      <Box data-testid="box">A</Box>
    </SilkProvider>,
  );
  expect(screen.getByTestId('box').getAttribute('data-padding')).toBe('4');
  expect(container.firstElementChild).toBeTruthy();
});

test('Box contain sets data-contain', () => {
  render(
    <Box contain data-testid="box">
      A
    </Box>,
  );
  expect(screen.getByTestId('box').getAttribute('data-contain')).toBe('true');
});

test('Stack renders vertical-only defaults and the className escape hatch', () => {
  render(
    <Stack className="consumer-stack" data-testid="stack">
      <span>a</span>
      <span>b</span>
    </Stack>,
  );
  const el = screen.getByTestId('stack');
  expect(el.getAttribute('data-gap')).toBe('2');
  expect(el.getAttribute('data-align')).toBe('stretch');
  expect(el.getAttribute('data-justify')).toBe('start');
  expect(el.getAttribute('data-rail')).toBe('none');
  expect(el.hasAttribute('data-direction')).toBe(false);
  expect(el.hasAttribute('data-wrap')).toBe(false);
  expect(el.className).toContain('consumer-stack');
});

test('Stack emits both alignment axes as data attributes', () => {
  render(
    <Stack align="center" justify="center" data-testid="stack">
      <span>a</span>
    </Stack>,
  );
  const el = screen.getByTestId('stack');
  expect(el.getAttribute('data-align')).toBe('center');
  expect(el.getAttribute('data-justify')).toBe('center');
});

test('Inline accepts collapseBelow and keeps wrapping defaults', () => {
  render(
    <Inline collapseBelow="md" className="consumer-inline" data-testid="inline">
      <span>a</span>
      <span>b</span>
    </Inline>,
  );
  const el = screen.getByTestId('inline');
  expect(el.getAttribute('data-collapse-below')).toBe('md');
  expect(el.getAttribute('data-direction')).toBe('row');
  expect(el.getAttribute('data-wrap')).toBe('wrap');
  expect(el.className).toContain('consumer-inline');
});

test('Inline renders recipe defaults', () => {
  render(
    <Inline data-testid="inline">
      <span>a</span>
      <span>b</span>
    </Inline>,
  );
  const el = screen.getByTestId('inline');
  expect(el.getAttribute('data-gap')).toBe('2');
  expect(el.getAttribute('data-align')).toBe('center');
  expect(el.getAttribute('data-justify')).toBe('start');
  expect(el.getAttribute('data-wrap')).toBe('wrap');
});

test('Grid renders auto columns and minColumnWidth public var', () => {
  render(
    <Grid data-testid="grid" minColumnWidth="12rem">
      <span>a</span>
    </Grid>,
  );
  const el = screen.getByTestId('grid');
  expect(el.getAttribute('data-columns')).toBe('auto');
  expect(el.getAttribute('data-align')).toBe('stretch');
  expect(el.getAttribute('data-justify')).toBe('stretch');
  expect(el.style.getPropertyValue('--silk-grid-min')).toBe('12rem');
});

test('Grid places items on both axes', () => {
  render(
    <Grid columns="3" align="center" justify="center" data-testid="grid">
      <span>a</span>
    </Grid>,
  );
  const el = screen.getByTestId('grid');
  expect(el.getAttribute('data-align')).toBe('center');
  expect(el.getAttribute('data-justify')).toBe('center');
});

test('Container renders defaults', () => {
  render(<Container data-testid="container">D</Container>);
  expect(screen.getByTestId('container').getAttribute('data-size')).toBe('lg');
  expect(screen.getByTestId('container').getAttribute('data-padding')).toBe(
    '4',
  );
});

test('Separator is decorative by default and exposes orientation', () => {
  const { rerender } = render(<Separator data-testid="sep" />);
  const sep = screen.getByTestId('sep');
  expect(sep.getAttribute('data-orientation')).toBe('horizontal');
  // Decorative separators are removed from the a11y tree
  expect(sep.getAttribute('role')).toBe('none');

  rerender(<Separator decorative={false} orientation="vertical" />);
  const roleSep = screen.getByRole('separator');
  expect(roleSep.getAttribute('aria-orientation')).toBe('vertical');
});

/**
 * Type-level guard: the removed axes must stay compile errors, otherwise a
 * migrated call site can silently reintroduce a horizontal Stack.
 */
test('Stack rejects the removed horizontal-flow props', () => {
  void (
    <>
      {/* @ts-expect-error Stack is vertical-only — use Inline */}
      <Stack direction="row" />
      {/* @ts-expect-error wrap moved to Inline */}
      <Stack wrap="wrap" />
      {/* @ts-expect-error collapseBelow moved to Inline */}
      <Stack collapseBelow="md" />
    </>
  );
});
