Silk is a design system in three packages: `silk-core` (tokens, themes, recipes; no platform imports), `silk` (web: Radix + Linaria) and `silk-native` (React Native, and the web through react-native-web).

## Before you design

- `docs/PRINCIPLES.md` is the charter. A change that conflicts with it is rejected or amends it (its "Amending this document"). Run its "Drift checklist" on any new or changed API.
- `docs/API_POLICY.md` says what is public API and how a change to it is versioned. `docs/ARCHITECTURE.md` says how the packages are built; `docs/COMPOSITES.md` is the standard for composites.

## Commands

```bash
corepack enable && yarn install
yarn build        # first: the other workspaces resolve silk-core from dist/
yarn typecheck
yarn test
```

CI also runs `yarn test:packed`, `yarn test:perf` (budgets in `perf-budgets.json`) and the Storybook tests (`yarn docs:build`, then `yarn test:storybook`).

There is no formatter. Match the file by hand (single quotes, trailing commas, about 100 columns) and never run Prettier, which would reformat every file it touches.

## Every change

- A change consumers can see gets a changeset (`yarn changeset`), written as "Changeset conventions" in `docs/API_POLICY.md` says.
- New or changed public API is also listed in `docs/API_POLICY.md`, under its "additions" section.
- A mechanic `silk-native` owns because no behavior library provides it is added to the list in `docs/PRINCIPLES.md` ("Current bindings") and pinned by a test.
- Never merge a pull request: the maintainer merges.

## silk-native traps

- Anything that moves under a finger runs on the UI thread: Gesture Handler for the gesture, Reanimated shared values for the position, and a spring from Silk's motion tokens (`springTo`) for the release. Build drags from `src/gesture/drag.ts` and take thresholds from `gestureConventions`.
- On the web, Gesture Handler writes each attached handler's `touch-action` and `user-select` onto the detector's view, a disabled handler's too, and the last write wins. Never compose a disabled gesture with an enabled one in one `GestureDetector`, and set `touch-action` through the detector's `touchAction` prop (as `useFlickGesture` returns it), not a style.
- The worklets Babel plugin compiles Silk only in a consuming app; Silk's other tests run worklets as plain functions. `src/worklets.test.ts` holds the failures only the compiled code has (a parameter default that reads a module constant or import: default in the body, `precision ?? SUBPIXEL`; a spread in the object a gesture hook takes; a module-level worklet that reads a declaration below it). Add each new one there.
- An animated style reruns only for shared values its own body reads. Read them there and pass plain numbers to helper worklets.
- Gesture Handler on the web hears pointer events, not mouse events: tests use `fireEvent.pointerDown`, `pointerMove` and `pointerUp`.
- rstest refuses an async mock factory. Import the real module with `import * as x from '…' with { rstest: 'importActual' }`.

## Keeping this file current

When you work out a trap or a procedure the code does not show, add it in the same task: to the doc that owns its topic, or here if none does.
