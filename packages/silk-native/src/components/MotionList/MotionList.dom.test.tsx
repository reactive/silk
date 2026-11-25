import { expect, rs, test } from '@rstest/core';
import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { SilkProvider } from '../../theme/SilkProvider.js';

/** Records what the list hands the FLIP step: the keys it measured, then the keys it reorders. */
const mocked = rs.hoisted(() => ({ calls: [] as [string, string[], boolean?][] }));

rs.mock('./reorder.js', () => ({
  measure: (items: Map<string, unknown>) => {
    mocked.calls.push(['measure', [...items.keys()]]);
    return new Map();
  },
  reorder: (
    _before: unknown,
    items: Map<string, unknown>,
    _spring: unknown,
    { fades }: { fades: boolean },
  ) => {
    mocked.calls.push(['reorder', [...items.keys()], fades]);
  },
}));

const { MotionList, MotionView } = await import('./MotionList.dom.js');

function List({ ids, dependency }: { ids: string[]; dependency: unknown }): JSX.Element {
  return (
    <SilkProvider>
      <MotionList layoutDependency={dependency}>
        {ids.map((id) => (
          <MotionView key={id} id={id} />
        ))}
      </MotionList>
    </SilkProvider>
  );
}

test('MotionList on the web follows the items mounted now, and fades only with its dependency', () => {
  const { rerender } = render(<List ids={['a', 'b']} dependency={1} />);
  rerender(<List ids={['a', 'b']} dependency={1} />);
  rerender(<List ids={['a']} dependency={2} />);
  expect(mocked.calls).toEqual([
    ['measure', ['a', 'b']],
    ['reorder', ['a', 'b'], false],
    ['measure', ['a', 'b']],
    // b's view went: the list no longer holds it.
    ['reorder', ['a'], true],
  ]);
});

test('MotionView hands its ref the host element, as a View does', () => {
  const ref = { current: null as unknown };
  render(
    <SilkProvider>
      <MotionList layoutDependency={0}>
        <MotionView id="a" ref={ref as never} testID="a" />
      </MotionList>
    </SilkProvider>,
  );
  expect(ref.current).toBe(document.querySelector('[data-testid="a"]'));
});
