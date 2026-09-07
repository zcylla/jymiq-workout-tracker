---
description: Route a design task (improve a Claude Design mockup, implement one into code, audit existing screens, extract a design system, or run discovery for a new one) to the right subset of installed design skills.
argument-hint: [improve|implement|audit|extract|discovery] <claude.ai/design URL, file path, or idea>
---

# /design — workout-tracker design router

`$ARGUMENTS` is the raw text the user typed after `/design`. Determine the mode, then follow that section only. Do not run every mode — pick one.

**Mode detection:**
- Starts with `improve`, or is a bare `claude.ai/design/...` URL with no other verb → **IMPROVE**
- Starts with `implement` and a `claude.ai/design/...` URL → **IMPLEMENT**
- Starts with `audit`, or names an existing screen/component path with no URL → **AUDIT**
- Starts with `extract` → **EXTRACT**
- Empty, or a vague idea with no URL and no existing screen named → **DISCOVERY**

A bare Claude Design URL defaults to IMPROVE, not IMPLEMENT — the design gets fixed before it gets built.

**Every skill named in backticks below (e.g. `mobile-app-ui-design`, `expo:expo-design-system`) is an instruction to call the Skill tool with that exact name — not a description to reason about from memory.** Before writing any critique, code, or findings in a mode, call the Skill tool once for each skill listed under "Required skills" for that mode, in order. If one of them doesn't appear in your available-skills listing, say so explicitly and stop rather than silently proceeding without it — do not fabricate its guidance.

---

## Shared: the mobile-web-contamination checklist

Claude Design's canvas renders every mockup as HTML/CSS/JS inside a browser device frame (`ios-frame.jsx` + `support.js` are that scaffolding, not app code). That medium leaks web assumptions into what's supposed to be a native mockup. Apply this checklist in IMPROVE, IMPLEMENT, and AUDIT modes — every flagged item is a concrete UX bug on a real device, not a style nitpick:

| Web pattern that leaked in | What it should be on iOS |
|---|---|
| Hover states, `cursor: pointer` | Pressed/active states only — nothing exists between touch-down and touch-up |
| CSS `box-shadow` used decoratively everywhere | Elevation used sparingly, matched to iOS's actual shadow conventions |
| A scrollable `<div>` with custom scrollbar styling | Native scroll behavior — no visible scrollbar, native bounce/rubber-banding |
| A centered modal/dialog with a dimmed backdrop `<div>` | A native sheet (bottom sheet, `.formSheet`) or full-screen push, per what the action actually is |
| Fixed-pixel padding for "safe area" | `useSafeAreaInsets` — device notch/home-indicator heights vary and aren't a CSS constant |
| A `<button>` styled with CSS transitions | `Pressable`/`@expo/ui` control with a real press-feedback curve, not a `transition: 0.2s` |
| Desktop-width text columns, hover-revealed secondary actions | Thumb-zone placement, primary action always visible and reachable one-handed |
| Arbitrary spacing values (13px, 22px, 37px) | 8-pt grid (8/12/16/24/32/48/64) |
| A web font stack or default system-ui font | SF Pro / SF Symbols, matched to what `expo-native-ui` actually ships |
| Animation as CSS `transition`/`@keyframes` | Reanimated on the native thread — `transform`/`opacity` only |

---

## IMPROVE — critique and fix the Claude Design mockup itself (no code yet)

Goal: the design gets better. Nothing gets implemented in this mode.

**Required skills, invoke in this order:** `mobile-app-ui-design` → `mobile-app-design-standards` → `improve-ui` → (only if a system emerges, step 7) `create-design-md`.

1. Import the project via the `claude_design` MCP (auth via `/design-login` if needed) and read the target `.dc.html` file plus whatever it imports (`ios-frame.jsx`, `support.js`, any shared components).
2. Run every screen in the mockup against the **contamination checklist** above — flag each hit with the screen name and what's wrong.
3. Invoke `mobile-app-ui-design` and apply its critique (60/30/10 color, 8-pt grid, thumb zone, typography caps, F-pattern) to every screen.
4. Invoke `mobile-app-design-standards` and apply its critique (HIG navigation conventions, touch target sizes, platform-native affordances) to every screen. Steps 3 and 4 are about the design being *good*, independent of the web-leakage issue in step 2.
5. Invoke `improve-ui` and follow its reporting discipline for everything gathered so far: read-only, evidence-based, no unsupported findings, output a plan rather than silently rewriting anything.
6. Present findings as: screen → issue → which step surfaced it (contamination / mobile-app-ui-design / mobile-app-design-standards) → why it's wrong for a native mobile surface → concrete fix. Group by severity (breaks on-device vs. stylistic).
7. Apply the fixes the user approves back into the `.dc.html` (and its imports) via the `claude_design` MCP, so the corrected version lives back on the same Claude Design project/URL.
8. If the resulting design settles into a real system (consistent palette, type scale, spacing, component set), invoke `create-design-md` against it to produce a `DESIGN.md` — this becomes the source of truth for tokens when IMPLEMENT mode runs later, so tokens get *derived* through `expo-design-system` rather than copied verbatim from the HTML.
9. Stop here. Do not write Expo/RN code in this mode, even if it would be quick.

## IMPLEMENT — turn an (ideally already-improved) Claude Design mockup into real Expo/RN code

**Required skills, invoke in this order:** `design-flow` → `expo:expo-design-system` → `expo:expo-native-ui` → `expo:expo-ui` → `mobile-app-ui-design` → `mobile-app-design-standards` → `vercel-react-native-skills` → `vercel-composition-patterns` → (`ios-design-review` and `ios-qa`, or `expo:eas-simulator`, for review).

1. Import via the `claude_design` MCP as above, and treat the `.dc.html` as **design intent and visual reference**, not a code source — never port its markup/CSS 1:1.
2. Re-run the contamination checklist as a second safety net even if IMPROVE mode already ran — translation is where remaining web assumptions actually surface as bugs.
3. Invoke the `design-flow` skill and follow it starting at its information-architecture stage (stage 3) — map each mockup screen to its Expo Router route, nav parent, and states (loading/empty/error/populated), since the mockup itself won't show non-happy-path states.
4. Tokens: invoke `expo:expo-design-system` to reconcile the mockup's palette/type/spacing into `theme.ts` (use the mockup's `DESIGN.md` if one exists from IMPROVE mode as the input, not the raw HTML).
5. Build: invoke `expo:expo-native-ui`, `expo:expo-ui`, `mobile-app-ui-design`, `mobile-app-design-standards`, `vercel-react-native-skills`, and `vercel-composition-patterns` — each contributes a distinct layer (native construction, native controls, composition craft, platform correctness, performance, component API shape). Never invoke `frontend-design` or `impeccable` here — CSS/Tailwind-calibrated, mismatched with this app's `StyleSheet`.
6. Review: invoke `ios-design-review` and `ios-qa` on-device or simulator, or `expo:eas-simulator` if no local simulator is available — not a browser-based check.

## AUDIT — read-only review of screens that already exist as real code

**Required skills, invoke in this order:** `improve-ui` → `mobile-app-design-standards` → `ios-design-review` → `ios-qa`.

1. Invoke `improve-ui` for the systematic, evidence-based audit against whatever design system already governs the surface.
2. Invoke `mobile-app-design-standards` for HIG/platform-convention compliance.
3. Invoke `ios-design-review` and `ios-qa` for an actual on-device/simulator pass.
4. Output a prioritized, self-contained fix plan. Do not apply fixes unless asked.

## EXTRACT — produce or refresh a DESIGN.md

**Required skill:** `create-design-md`.

Invoke `create-design-md` against whichever source is given: the current app's code, or a Claude Design URL (import via `claude_design` MCP first, then extract from the rendered mockup). Record the design language that governs it — not every incidental value that happens to appear.

## DISCOVERY — no existing design or mockup, starting from a vague idea

Ask before designing anything. Cover, in order:
1. **App context** — what is this screen/feature for, who's using it (new vs. returning), what's the one primary action?
2. **Aesthetic direction** — what should this feel like (energetic/calm, playful/serious, premium/utilitarian)? Any reference apps or existing brand cues to anchor to or explicitly avoid?
3. **Constraints** — offline behavior, performance-sensitive surfaces (lists, animations), accessibility needs.
4. **Differentiation** — what should make this feel like *your* app rather than a generic fitness-tracker template?

Then hand off: brief → `design-flow` stage 3 (IA) → stage 4 (`expo-design-system` for tokens) → stage 5 (tasks) → build/review as in IMPLEMENT.
