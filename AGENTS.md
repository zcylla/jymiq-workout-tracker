# Jymiq

Expo SDK 57 / RN 0.86 / React 19, New Architecture, React Compiler on, typed routes on.
Android first (there is no iOS device to verify against); iOS paths stay isolated but untested.

**Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing against
an Expo API.** This SDK moved several things (Reanimated 4 worklets, headless router tabs, the
font config plugin) and general knowledge is wrong about them.

## Where the build is

Read `claudedocs/build-log.md` first — it holds build state, what runs on the device today, what is
next, and the environment facts that break the build if missed (Gradle needs **JDK 21**, and
**`ANDROID_HOME`** must be set).

## Where the design lives

- `claudedocs/design-exploration.md` **§0** is the locked decision table. It wins every argument.
- `claudedocs/design-labs/kit.py` is that table as code — it is the component spec, one primitive
  per function.
- The boards (`lab*.py`, published to the Claude Design project) are the reference renders.
  Earlier labs are reasoning, not state; do not build from them.
- What to build next is "Pick this up here" at the top of `claudedocs/build-log.md`. (The original
  plan file under `~/.claude/plans/` is gone; nothing depends on it.)
- `claudedocs/body-map.md` is the spec for the Strength tab's muscle figure — unscheduled, built later.

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
- **Icons use the free Hugeicons Stroke Rounded pack.** `src/components/icon-map.ts` is the
  mapping from the existing `IconName` API to `@hugeicons/core-free-icons` exports; import individual
  icon modules so Metro does not load the whole pack. `src/components/icon-sizes.ts` owns
  `ICON_NAMES`, `ICON_SIZE` and `ICON_STROKE_WIDTH`. `Icon` renders `HugeiconsIcon` through
  `react-native-svg`, using only `Ink` tones. Each icon mounts an SVG subtree; the former font
  used one native text draw. `Grip` stays two plain Views.
  To add an icon: pick a free, line-only icon with rounded caps/joins, add its name to `ICON_NAMES`,
  import and map it in `ICON_MAP`, and add its default size and calibrated stroke width to the
  two tables. **On-screen stroke = strokeWidth × size / 24**; match the existing 1.3–1.9pt range,
  rather than using one raw width at every size. `pnpm check` rejects missing entries, icons not
  exported by the free pack, fills, incompatible strokes and off-weight defaults. New icons need
  no prebuild or native rebuild. **This migration does require a one-time native rebuild** to link
  `react-native-svg` and remove the old font plugin/assets. The Python design boards' `kit.py ICONS`
  remain the historical drawing spec and intentionally differ from the app's Hugeicons shapes.

- **Weights are stored in kilograms, always.** lb is a display transform in `src/lib/units.ts`.
- **`src/lib/**` is pure**: no React, no SQLite, no Expo imports. It is the only tested layer.
- **Containment has three levels** (Lab 42): a row plate for anything you touch, one grouped plate
  for the screen's main component, nothing at all for read-only tables, prose, charts and rails.
  Two or three plated things per screen is the budget.
- Every touchable is at least 44pt. Read-only table rows are 34.
- Changing `babel.config.js`, `metro.config.js` or a config plugin means a native rebuild, and
  `pnpm expo start -c` — a stale Metro cache fails as wrong output, not as an error.

## Tooling that will reject your work

- **Conventional commits are enforced.** lefthook's `commit-msg` hook runs commitlint, and the
  scope must be one of `theme components icons app data lib dev design build deps`
  (`commitlint.config.js`). Single-line messages, no body, no trailers.
- **Biome formats, ESLint lints.** Biome owns formatting only; ESLint keeps the React Native,
  React Compiler and Expo rules plus the custom `somethingSV` rule, which Biome cannot express.
  `src/theme/type.ts` has a `lineWidth: 110` override so the type ramp stays a one-line-per-step
  table — that is the point of that file.
- `pre-commit` runs Biome and `tsc`; `pnpm check` runs format, typecheck, lint, the icon style
  check and the tests.

## Commands

**The package manager is pnpm**, pinned by `packageManager` in `package.json`. Do not run `npm` or
`yarn` against this repo — `.npmrc`'s `node-linker=hoisted` and `package.json`'s
`pnpm.onlyBuiltDependencies` are both load-bearing for the native build, and neither has an npm
equivalent. See `claudedocs/build-log.md` for the three ways the build fails without them.

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk    # Gradle needs 21; the machine defaults to 11
export ANDROID_HOME=$HOME/Android/Sdk

pnpm install                        # also fetches the 36 MB of exercise illustrations
pnpm check                          # format + typecheck + lint + icon style + unit tests
pnpm start:dev                      # Jymiq Dev Metro, Supabase vars blank
pnpm prebuild:dev                   # clean Android generation for Jymiq Dev, no cloud
pnpm prebuild:prod                  # clean Android generation for Jymiq (default identity)
pnpm build:dev                      # clean prebuild + arm64 debug APK, no cloud
pnpm build:prod                     # clean prebuild + arm64 release APK
pnpm expo run:android               # full dev build onto a connected phone (no emulator installed)
pnpm expo start --dev-client        # then just Metro
adb reverse tcp:8081 tcp:8081       # phone reaches Metro over USB
pnpm db:gen                         # regenerate migrations after editing src/data/schema.ts
pnpm expo customize tsconfig.json   # regenerate typed-route types without starting Metro
```

Production is the default and holds real workout data and cloud backup. Development uses
`com.zcylla.jymiq.dev`, its own SQLite sandbox, `jymiqdev`, and red launcher accents. Use the dev
scripts to keep both Supabase variables empty, including during Gradle. Switching variants requires
`prebuild --clean`; the scripts regenerate disposable `android/`. Export the JDK/SDK variables above
before building. See `claudedocs/build-log.md` for signing and database access.
