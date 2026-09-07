# Workout tracker

Expo SDK 57 / RN 0.86 / React 19, New Architecture, React Compiler on, typed routes on.
Android first (there is no iOS device to verify against); iOS paths stay isolated but untested.

**Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing against
an Expo API.** This SDK moved several things (Reanimated 4 worklets, headless router tabs, the
font config plugin) and general knowledge is wrong about them.

## Where the design lives

- `claudedocs/design-exploration.md` **§0** is the locked decision table. It wins every argument.
- `claudedocs/design-labs/kit.py` is that table as code — it is the component spec, one primitive
  per function.
- The boards (`lab*.py`, published to the Claude Design project) are the reference renders.
  Earlier labs are reasoning, not state; do not build from them.
- The implementation plan is at `~/.claude/plans/start-by-making-a-rippling-fog.md`.

## Conventions that are not obvious

- **`src/theme/tokens.ts` is the only file with a hex literal.** Screens import components,
  components import theme. No screen sets a fontSize, a family or a raw colour.
- **CSS letter-spacing is em, RN's is points.** Always go through `ls(em, px)` in `type.ts`.
- **Fonts:** `src/theme/fonts.ts` is the only place a family name appears. iOS resolves by
  PostScript name and must never also receive `fontWeight` (it synthesises a second bold);
  Android resolves by family + weight. Both failures are silent.
- **Reanimated shared values are named `somethingSV` and read with `.get()` / `.set()`.**
  `.value` is a mutable read React Compiler cannot see, so it caches a stale frame. An ESLint rule
  enforces the suffix convention.
- `runOnJS` is `scheduleOnRN` from `react-native-worklets` in Reanimated 4.
- **Weights are stored in kilograms, always.** lb is a display transform in `src/lib/units.ts`.
- **`src/lib/**` is pure**: no React, no SQLite, no Expo imports. It is the only tested layer.
- **Containment has three levels** (Lab 42): a row plate for anything you touch, one grouped plate
  for the screen's main component, nothing at all for read-only tables, prose, charts and rails.
  Two or three plated things per screen is the budget.
- Every touchable is at least 44pt. Read-only table rows are 34.
- Changing `babel.config.js`, `metro.config.js` or a config plugin means a native rebuild, and
  `npx expo start -c` — a stale Metro cache fails as wrong output, not as an error.

## Commands

```
npm run check       # typecheck + lint + unit tests
npm run android     # dev build on a connected device
npm run db:gen      # regenerate drizzle migrations after editing src/data/schema.ts
```
