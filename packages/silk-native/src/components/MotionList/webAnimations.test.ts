import { expect, test } from '@rstest/core';
import { defaultMotion } from '@reactive/silk-core';
import { glide, isCrossing, leave, type MotionElement, stop } from './webAnimations.js';

/** A row whose Web Animations are stand-ins jsdom lacks: `land()` finishes the last one's glide. */
function row(zIndex: string) {
  const node = document.createElement('div');
  node.style.zIndex = zIndex;
  const finished: (() => void)[] = [];
  node.animate = () => {
    const animation = new EventTarget() as Animation;
    const finish = { finished: new Promise(() => {}) };
    Object.assign(animation, { cancel: () => {}, playState: 'running', currentTime: 0, ...finish });
    finished.push(() => animation.dispatchEvent(new Event('finish')));
    return animation;
  };
  return { node, el: node as unknown as MotionElement, land: () => finished.at(-1)?.() };
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
