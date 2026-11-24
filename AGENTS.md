Silk is a design system in three packages: `silk-core` (tokens, themes, recipes; no platform imports), `silk` (web: Radix + Linaria) and `silk-native` (React Native, and the web through react-native-web).

## Where things are written

- `docs/PRINCIPLES.md`: the charter. A change that conflicts with it is rejected or amends it. Run its "Drift checklist" on any significant change.
- `docs/API_POLICY.md`: what is public API, how a change to it is versioned, and how to write its changeset.
- `docs/ARCHITECTURE.md`: how the packages are built. `docs/COMPOSITES.md`: the standard for composites.
- `README.md`, "Development": setup and commands. CI (`.github/workflows/ci.yml`) runs all of its test scripts.
- `packages/silk-native/AGENTS.md`: gesture, worklet and test traps. Read it before changing anything in that package.

## Every change

- A change consumers can see gets a hand-written `.changeset/<topic>.md`.
- New or changed public API is also listed in `docs/API_POLICY.md`, under the "… additions" heading for its topic (such as "Native paging and gesture additions").
- A new component, or one that grows, needs its budget in `perf-budgets.json`: run `yarn test:perf`.
- There is no formatter. Match the file by hand (single quotes, trailing commas, about 100 columns) and never run Prettier, which would reformat every file it touches.

## Keeping these files current

When you work out a trap or a procedure the code does not show, write it down in the same task, where its topic lives: a comment beside the code for one module, the doc above that owns the subject, a package's `AGENTS.md` for that package, or here if it applies to the whole repo.
