/**
 * Spring physics, platform-neutral: the closed form of a damped oscillator of
 * mass 1, described by a `Spring` token (`durationMs`, `bounce`). Native
 * renderers step it on the UI thread (`springAt` is a worklet); the web plays
 * it as an easing sampled from rest (`sampleSpring`), or as keyframes from
 * wherever a moving thing is (`sampleSpringOffsets`).
 */
import type { Spring } from '../tokens/types.js';

/** Offset from the target and velocity (units per second). */
export interface SpringState {
  readonly offset: number;
  readonly velocity: number;
}

/** Frames per second a spring is sampled at. */
const SAMPLE_RATE = 60;

/**
 * Position and velocity `seconds` after starting at `start` (offset from the
 * target and speed). A worklet, so a native UI thread can run it every frame.
 */
export function springAt(spring: Spring, start: SpringState, seconds: number): SpringState {
  'worklet';
  const omega = (2 * Math.PI * 1000) / spring.durationMs;
  const zeta = 1 - spring.bounce;
  const { offset, velocity } = start;
  const decay = Math.exp(-zeta * omega * seconds);
  if (zeta >= 1) {
    const b = velocity + omega * offset;
    return {
      offset: decay * (offset + b * seconds),
      velocity: decay * (b - omega * (offset + b * seconds)),
    };
  }
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const b = (velocity + zeta * omega * offset) / omegaD;
  const cos = Math.cos(omegaD * seconds);
  const sin = Math.sin(omegaD * seconds);
  return {
    offset: decay * (offset * cos + b * sin),
    velocity:
      decay *
      ((b * omegaD - zeta * omega * offset) * cos - (offset * omegaD + zeta * omega * b) * sin),
  };
}

/**
 * Whether a spring this far off and this fast is within `precision` of rest:
 * off by less than `precision`, and moving less than that per frame at 60 fps.
 */
export function springAtRest({ offset, velocity }: SpringState, precision: number): boolean {
  'worklet';
  return Math.abs(offset) < precision && Math.abs(velocity) < precision * SAMPLE_RATE;
}

/** How close to 1 a sampled curve must come before it ends. */
const SAMPLE_PRECISION = 0.001;
/** Safety cap, in durations: springs within createTheme's bounce limit settle well before it. */
const MAX_DURATIONS = 12;

export interface SpringOffsets {
  /** How long the spring takes to come within the precision of rest (ms). */
  readonly settleMs: number;
  /** Offset from the target at 60 fps, from the start's offset to exactly 0. */
  readonly offsets: readonly number[];
}

/**
 * The spring played from `start` (offset and speed), sampled at 60 fps until
 * it is within `precision` of rest: keyframes for a renderer that moves
 * something by its offset from where it lands (the web's Web Animations),
 * keeping the speed it had.
 */
export function sampleSpringOffsets(
  spring: Spring,
  start: SpringState,
  precision: number,
): SpringOffsets {
  const offsets = [start.offset];
  const maxFrames = (MAX_DURATIONS * spring.durationMs * SAMPLE_RATE) / 1000;
  for (let frame = 1; frame < maxFrames; frame++) {
    const state = springAt(spring, start, frame / SAMPLE_RATE);
    if (springAtRest(state, precision)) break;
    offsets.push(state.offset);
  }
  offsets.push(0);
  return { settleMs: Math.round(((offsets.length - 1) / SAMPLE_RATE) * 1000), offsets };
}

export interface SpringSamples {
  /**
   * How long the spring takes to settle (ms): always longer than the token's
   * `durationMs` (time to arrive), more so when it bounces.
   */
  readonly settleMs: number;
  /** Progress from 0 to exactly 1 at 60 fps, from rest. Above 1 while it overshoots. */
  readonly progress: readonly number[];
}

/**
 * The spring played from rest to its target, sampled at 60 fps until it
 * settles: what a renderer without springs (CSS's `linear()` easing, a timing
 * curve) plays. Renderers cache it per theme.
 */
export function sampleSpring(spring: Spring): SpringSamples {
  const { settleMs, offsets } = sampleSpringOffsets(
    spring,
    { offset: 1, velocity: 0 },
    SAMPLE_PRECISION,
  );
  return { settleMs, progress: offsets.map((offset) => Math.round((1 - offset) * 1e4) / 1e4) };
}
