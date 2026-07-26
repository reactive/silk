import { afterEach, expect, test } from '@rstest/core';
import { cleanup, render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Box } from './Box';
import { Center } from './Center';
import { Container } from './Container';
import { Grid } from './Grid';
import { Inline } from './Inline';
import { Separator } from './Separator';
import { Stack } from './Stack';

afterEach(() => {
  cleanup();
});

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

test('Stack accepts collapseBelow and className escape hatch', () => {
  render(
    <Stack
      direction="row"
      collapseBelow="md"
      className="consumer-stack"
      data-testid="stack"
    >
      <span>a</span>
      <span>b</span>
    </Stack>,
  );
  const el = screen.getByTestId('stack');
  expect(el.getAttribute('data-collapse-below')).toBe('md');
  expect(el.className).toContain('consumer-stack');
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
  expect(el.style.getPropertyValue('--silk-grid-min')).toBe('12rem');
});

test('Center and Container render defaults', () => {
  render(
    <>
      <Center data-testid="center">C</Center>
      <Container data-testid="container">D</Container>
    </>,
  );
  expect(screen.getByTestId('center').getAttribute('data-axis')).toBe('both');
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
