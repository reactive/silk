import { afterEach, describe, expect, rs, test } from '@rstest/core';
import { act, render } from '@testing-library/react';
import { type JSX, useEffect } from 'react';
import { setPrefersReducedMotion } from '../../../../../test/rstest-setup';
import { SilkProvider } from '../../theme/SilkProvider.js';

/**
 * jsdom runs no layout animations, so Reanimated's view stands in: it records
 * the props each item renders with, and each mount, by testID.
 */
const mocked = rs.hoisted(() => ({
  views: [] as { testID?: string; layout?: unknown; entering?: unknown }[],
  mounts: [] as (string | undefined)[],
}));

rs.mock('react-native-reanimated', () => ({
  default: {
    View: (props: { testID?: string; layout?: unknown; entering?: unknown }) => {
      // Once per mount.
      useEffect(() => {
        mocked.mounts.push(props.testID);
      }, []);
      mocked.views.push(props);
      return null;
    },
  },
  defineAnimation: () => 0,
  withTiming: () => 0,
  Easing: { linear: (t: number) => t, bezier: () => ({ factory: () => (t: number) => t }) },
}));

const { MotionList, MotionView } = await import('./MotionList.layout.js');

afterEach(() => {
  mocked.views.length = 0;
  mocked.mounts.length = 0;
});

function List({ ids, dependency }: { ids: string[]; dependency: unknown }): JSX.Element {
  return (
    <SilkProvider>
      <MotionList layoutDependency={dependency}>
        {ids.map((id) => (
          <MotionView key={id} id={id} testID={id} />
        ))}
      </MotionList>
    </SilkProvider>
  );
}

/** Renders `ids` (again, on `rerender`) and returns the props each item rendered with. */
function shown(render: () => void) {
  mocked.views.length = 0;
  act(render);
  return new Map(mocked.views.map((props) => [props.testID, props]));
}

describe('MotionList on native', () => {
  test('fades in only the items that arrive with its dependency', () => {
    let rerender!: (ui: JSX.Element) => void;
    const first = shown(() => {
      rerender = render(<List ids={['a']} dependency={1} />).rerender;
    });
    expect(first.get('a')?.entering).toBeUndefined();
    const changed = shown(() => rerender(<List ids={['a', 'b']} dependency={2} />));
    expect(changed.get('b')?.entering).toBeDefined();
    expect(changed.get('a')?.layout).toBeDefined();
    const steady = shown(() => rerender(<List ids={['a', 'b', 'c']} dependency={2} />));
    expect(steady.get('c')?.entering).toBeUndefined();
    // Still glides when it moves without the dependency changing.
    expect(steady.get('a')?.layout).toBeDefined();
  });

  test('animates nothing while motion is reduced', () => {
    setPrefersReducedMotion(true);
    const { rerender } = render(<List ids={['a']} dependency={1} />);
    const changed = shown(() => rerender(<List ids={['a', 'b']} dependency={2} />));
    expect(changed.get('a')?.layout).toBeUndefined();
    expect(changed.get('b')?.entering).toBeUndefined();
  });

  test('keeps its items mounted when reduced motion turns on', () => {
    render(<List ids={['a']} dependency={1} />);
    const reduced = shown(() => setPrefersReducedMotion(true));
    expect(reduced.get('a')?.layout).toBeUndefined();
    expect(mocked.mounts).toEqual(['a']);
  });
});
