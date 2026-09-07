---
name: design-flow
description: Orchestrates the full idea-to-shipped-screen pipeline for this app (requirements, brief, information architecture, tokens, tasks, build, review), routing each stage to the best tool already installed in this project instead of reimplementing any of them. Use when starting a new screen, a new feature, or a significant UI change from a vague idea. Skip for a small isolated tweak — use baseline-ui or improve-ui directly instead.
---

# Design Flow — workout-tracker

A seven-stage pipeline. Every stage below names the exact skill or agent to invoke — do not reimplement any stage's logic inline. This skill is the router, not the content.

Adapted from julianoczkowski/designer-skills' `design-flow`, with every stage that duplicated an already-installed, better-fitted tool replaced by that tool, and the one stage nothing else covers (information architecture) kept and written fresh for this stack.

## 1. Requirements — interrogate before building

Invoke **`superpowers:brainstorming`**. Do not skip straight to a screen. Force answers to:
- What is this screen/feature for, and what's the one action it exists to enable?
- What data does it read or write (sets, reps, weight, dates, PRs)?
- Does it need to work offline? What happens to unsynced data?
- New user vs. returning user — different defaults?

## 2. Brief — synthesize stage 1 into a short spec

Compress the brainstorming output into: goal, primary user, screens touched, constraints (offline, performance, existing nav). If the direction still feels unresolved, run gstack's `/design-consultation` for a second pass. Keep this to a paragraph plus a bullet list — it feeds stage 3, it isn't the deliverable.

## 3. Information architecture — the stage nothing else in this project covers

For every screen or flow touched, work through this before any token or component decision:

- **Navigation model**: does this belong in a bottom tab, or push onto a stack from one? Expo Router is file-based — sketch the route file(s) this implies (`app/(tabs)/workout.tsx`, a modal via `app/(modal)/log-set.tsx`, etc.) before writing components.
- **Content hierarchy**: what's the one thing the user should notice first on this screen? What's secondary, what's tertiary-and-collapsible?
- **State inventory**: idle, loading, empty (no workouts yet), error (save failed, offline), and populated. Design the empty and error states as first-class, not an afterthought — this is a personal-data app, and a blank "no workouts" screen is a common first impression.
- **Data flow**: where does this screen's data come from (local storage, sync), and what does it write back, and when (optimistic vs. confirmed)?
- **Entry/exit points**: what screens link here, and where does back/dismiss go?

Write this as a short structured note (screens → route → nav parent → states → primary data flow). This note is what stage 4 and stage 6 both consume.

## 4. Design tokens — don't invent a token system, extend the one built for this stack

Invoke **`expo:expo-design-system`** to establish or extend `theme.ts` (color, spacing, typography, radius, shadow, motion). If you're starting the token system from scratch and want architecture guidance (primitive → semantic → component layering), pull in **`ui-ux-pro-max:design-system`** for that structure, then let `expo-design-system` own the actual RN implementation. Never use Tailwind-vocabulary guidance here — this project has no NativeWind.

## 5. Task breakdown

Turn the brief + IA note into an ordered, independently-shippable checklist with **TodoWrite**, following **`superpowers:writing-plans`** conventions. Each task should be one vertical slice (one screen or one state), not "build all the UI" as a single item.

## 6. Build

Compose from, in this order of authority:
1. **`expo:expo-native-ui`** — HIG-correct native screen construction: semantic colors, native controls, SF Symbols, visual effects.
2. **`expo:expo-ui`** — reach for `@expo/ui` (native SwiftUI/Compose) for sheets, pickers, sliders, toggles before Reanimated or RN built-ins.
3. **`mobile-app-ui-design`** — composition craft: 60/30/10 color rule, 8-pt grid, thumb zone, typography caps.
4. **`mobile-app-design-standards`** — platform-convention correctness: touch target sizes, back-button placement, haptics.
5. **`vercel-react-native-skills`** + **`vercel-composition-patterns`** — list performance, animation on the native thread, component API shape.
6. **`ui-ux-pro-max`** (core) — only for stack-aware pattern lookup (e.g. "what's the industry convention for a fitness app's logging screen"), not for its token or brand sub-skills.

Do **not** invoke `frontend-design` or `impeccable` for this project — both are calibrated to CSS/Tailwind output (gradient bans, selector-specificity rules, Tailwind-class detectors) and this app has neither CSS nor Tailwind. Their guidance doesn't transfer to `StyleSheet` objects.

## 7. Review — route by target, not by habit

This project has no browser-automation MCP (Playwright/chrome-devtools were removed), so a web design-review loop does not apply to native screens by default.

- **Native (iOS/Android) screens — the default case**: use **`ios-design-review`** and **`ios-qa`** for device/simulator-driven visual QA. If no local simulator is available, `expo:eas-simulator` runs one on EAS's cloud and can screenshot it.
- **Web export only** (if you're actually shipping the `react-native-web` build): `web-design-guidelines` for the ARIA/accessibility/UX rule check, plus gstack `/design-review` if you want a Playwright-style pass on that build specifically.
- **Either target**: run **`improve-ui`** first for a read-only audit and handoff plan before applying any fixes — don't let the review stage silently rewrite the screen it's reviewing.

## When to skip this whole flow

A one-line copy change, a single color/spacing tweak, or fixing one reported bug doesn't need stages 1–5. Go straight to `baseline-ui` (fast deslop) or `improve-ui` (audit + plan) on the affected screen.
