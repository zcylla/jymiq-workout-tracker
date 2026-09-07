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
- The implementation plan is at `~/.claude/plans/start-by-making-a-rippling-fog.md`.
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
- **Icons live in `assets/icons/ui/*.svg`**, which is the source of truth — most are `kit.py`'s
  `ICONS`, one (`gear`) is Lucide's, re-stroked. `react-native-nano-icons` compiles the folder into
  a subsetted font at prebuild, so a glyph is one native text draw — never a Skia canvas or an SVG
  subtree per row. To add one: draw it, or take Lucide's (ISC) and **re-stroke it to our ratio**,
  in a square box in the same idiom (strokes only, round caps and joins, `fill="none"`,
  `stroke="#000000"`, `<path>` only — convert `<circle>`/`<rect>` to path data). Then add it to
  `ICON_SIZE` in `src/components/icon-sizes.ts` with the size it is rendered at, run
  `pnpm expo prebuild` **and a native rebuild** — the plugin fingerprints the folder, so a Metro
  reload is not enough. Skipping the rebuild fails **silently as the wrong glyphs**: codepoints are
  assigned alphabetically, so adding one icon renumbers every later one and the stale font on the
  device draws a clock where a chart should be. `pnpm check` runs `scripts/check-icons.mjs`, which fails on an off-style or undeclared
  icon. **The constant is the on-screen stroke width, not the stroke value**: the box is chosen to
  suit the render size, so a 16-box chevron drawn at 13pt carries a 1.7 stroke and a 22-box icon at
  22pt carries 1.6, and both read as the same weight. There is no runtime weight prop —
  `ICON_SIZE` is also each icon's default size, so `<Icon name="chev" />` is already 13.

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
pnpm expo run:android               # full dev build onto a connected phone (no emulator installed)
pnpm expo start --dev-client        # then just Metro
adb reverse tcp:8081 tcp:8081       # phone reaches Metro over USB
pnpm db:gen                         # regenerate migrations after editing src/data/schema.ts
pnpm expo customize tsconfig.json   # regenerate typed-route types without starting Metro
```
