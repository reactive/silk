Silk is a design system in three packages: `silk-core` (tokens, themes, recipes; no platform imports), `silk` (web: Radix + Linaria) and `silk-native` (React Native, and the web through react-native-web).

## Before you design

- `docs/PRINCIPLES.md` is the charter. A change that conflicts with it is rejected or amends it (its "Amending this document"). Run its "Drift checklist" on any significant change.
- `docs/API_POLICY.md` says what is public API and how a change to it is versioned. `docs/ARCHITECTURE.md` says how the packages are built; `docs/COMPOSITES.md` is the standard for composites.

## Commands

```bash
corepack enable && yarn install
yarn build        # first: the other workspaces resolve silk-core from dist/
yarn typecheck
yarn test
```

CI (`.github/workflows/ci.yml`) also runs `yarn test:packed`, `yarn test:perf` and the Storybook tests.

There is no formatter. Match the file by hand (single quotes, trailing commas, about 100 columns) and never run Prettier, which would reformat every file it touches.

## Every change

- A change consumers can see gets a hand-written `.changeset/<topic>.md`, as "Changeset conventions" in `docs/API_POLICY.md` says.
- New or changed public API is also listed in `docs/API_POLICY.md`, under the "… additions" heading for its topic (such as "Native paging and gesture additions").
- A new component, or one that grows, needs its budget in `perf-budgets.json`: run `yarn test:perf`.
- A mechanic `silk-native` owns because no behavior library provides it is added to the list under "Current bindings" in `docs/PRINCIPLES.md`, with a dated "Amendment log" entry, and pinned by a test.
- Never merge a pull request: the maintainer merges.

## silk-native traps

Paths in this section are under `packages/silk-native/`.

- Anything that moves under a finger runs on the UI thread: Gesture Handler for the gesture, Reanimated shared values for the position, and `springTo` for the release. Build a drag with `panAlong` and `useReleaseTimer` (`src/gesture/drag.ts`), which take their thresholds from `gestureConventions`. The exception is a control that moves on press, as Slider's web pan does.
- On the web, Gesture Handler writes each attached handler's `touch-action` and `user-select` onto the detector's view, a disabled handler's too, and the last write wins. Never compose a disabled gesture with an enabled one in one `GestureDetector`: leave it out of the composition (`src/components/useSliderDrag.ts`). Set `touch-action` through the detector's `touchAction` prop (as `useFlickGesture` returns it), not a style.
- Tests run worklets uncompiled. `src/worklets.test.ts` (it covers `silk-core` too) pins what only the worklets Babel plugin's output breaks: read its comments before writing a worklet, merge gesture configs through `panAlong` rather than a spread, and add each new failure there.
- An animated style reruns only for shared values its own body reads. Read them there, pass plain numbers to helper worklets, and pass `WEB ? [those values] : undefined` as its dependencies (native warns on the array).
- Gesture tests mock Gesture Handler and call its configs by hand (copy `src/components/Slider.drag.test.tsx`). Only Storybook play tests run it for real, and there it hears pointer events, not mouse events (`apps/docs/src/native/Forms.stories.tsx`).
- rstest refuses an async mock factory. Import the real module with `import * as x from '…' with { rstest: 'importActual' }`.

## Keeping this file current

When you work out a trap or a procedure the code does not show, add it in the same task: to the doc that owns its topic, or here if none does.
