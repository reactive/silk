import { expect, test } from '@rstest/core';
import { defaultMotion } from '@reactive/silk-core';
import { arrive, glide, isCrossing, leave, type MotionElement, stop } from './webAnimations.js';

/**
 * A row whose Web Animations are stand-ins jsdom lacks: `played` lists their
 * keyframes, `animations` the animations, and `land()` finishes the last one's glide.
 */
function row(zIndex: string) {
  const node = document.createElement('div');
  node.style.zIndex = zIndex;
  const finished: (() => void)[] = [];
  const played: Keyframe[][] = [];
  const animations: Animation[] = [];
  node.animate = (keyframes) => {
    played.push(keyframes as Keyframe[]);
    const animation = new EventTarget() as Animation;
    const finish = { finished: new Promise(() => {}) };
    Object.assign(animation, { cancel: () => {}, playState: 'running', currentTime: 0, ...finish });
    finished.push(() => animation.dispatchEvent(new Event('finish')));
    animations.push(animation);
    return animation;
  };
  const land = () => finished.at(-1)?.();
  return { node, el: node as unknown as MotionElement, played, animations, land };
}

const from = { x: 0, y: 40 };
const still = { x: 0, y: 0 };

test("a lifted glide raises the row while it crosses, then puts back the row's own z-index", () => {
  const { node, el, land } = row('5');
  glide(el, defaultMotion.brisk, from, still, { lifted: true });
  expect(node.style.zIndex).toBe('1');
  expect(isCrossing(el)).toBe(true);
  land();
  expect(node.style.zIndex).toBe('5');
  expect(isCrossing(el)).toBe(false);
});

test('stopping a lifted glide puts the row down; a glide that never lifted leaves its z-index', () => {
  const { node, el, land } = row('5');
  glide(el, defaultMotion.brisk, from, still, { lifted: true });
  stop(el);
  expect(node.style.zIndex).toBe('5');
  glide(el, defaultMotion.brisk, from, still, { lifted: false });
  expect(node.style.zIndex).toBe('5');
  land();
  expect(node.style.zIndex).toBe('5');
});

test('a row that leaves from inside a gliding row fades where it was, not riding the glide', () => {
  const list = document.createElement('div');
  const mover = row('');
  const child = row('');
  list.append(mover.node);
  document.body.append(list);
  glide(mover.el, defaultMotion.brisk, from, still, { lifted: false });
  const position = { at: still, velocity: still, width: 10, height: 10 };
  leave([{ ...position, el: child.el, parent: mover.el }], defaultMotion.fast);
  expect(child.node.parentElement).toBe(list);
  list.remove();
});

test('a row leaving mid-arrival fades out from the opacity it reached, not from fully shown', () => {
  const list = document.createElement('div');
  const leaver = row('');
  document.body.append(list);
  // the arrival's progress, as the browser reports it once the row is back in the page
  leaver.node.style.opacity = '0.3';
  const position = { at: still, velocity: still, width: 10, height: 10 };
  const parent = list as unknown as MotionElement;
  leave([{ ...position, el: leaver.el, parent }], defaultMotion.fast);
  expect(leaver.played.at(-1)?.[0]).toEqual({ opacity: '0.3' });
  list.remove();
});

test('a glide starts on the frame showing now, so a list rendering every frame still moves', () => {
  const { el, animations } = row('');
  Object.defineProperty(document, 'timeline', { value: { currentTime: 1234 }, configurable: true });
  glide(el, defaultMotion.brisk, from, still, { lifted: false });
  expect(animations.at(-1)?.startTime).toBe(1234);
  Reflect.deleteProperty(document, 'timeline');
});

test("landing leaves a z-index React set mid-glide, not the row's old one", () => {
  const { node, el, land } = row('5');
  glide(el, defaultMotion.brisk, from, still, { lifted: true });
  node.style.zIndex = '';
  land();
  expect(node.style.zIndex).toBe('');
});

test('a fade whose easing the browser refuses plays linearly instead of throwing', () => {
  const node = document.createElement('div');
  const easings: unknown[] = [];
  node.animate = (_keyframes, options) => {
    const { easing } = options as KeyframeAnimationOptions;
    if (easing !== 'linear') throw new TypeError(`Invalid easing ${easing}`);
    easings.push(easing);
    return new EventTarget() as Animation;
  };
  const refused = { durationMs: 200, easing: 'cubic-bezier(1.5, 0, 0.5, 1)' };
  arrive(node as unknown as MotionElement, refused);
  expect(easings).toEqual(['linear']);
});
