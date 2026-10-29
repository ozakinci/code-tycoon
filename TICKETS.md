# Code Tycoon — Tickets

Bug/issue tracker for local development. Each ticket has an ID, status, severity, and enough detail to pick up and fix independently.

Statuses: `open` → `in-progress` → `fixed` → `verified`. `superseded` marks a fix that a later ticket replaced.

---

## BUG-001: Technical Debt cost formula overflows to Infinity on long idle sessions

- **Status:** superseded
- **Severity:** high
- **Found:** 2026-07-05, via code review + Node simulation while investigating a report of the game becoming unresponsive after being left open a long time.
- **Location:** [src/App.tsx:840-857](src/App.tsx#L840-L857) (Refactor button cost/disabled logic)

**Description**

Technical Debt (TD) has no upper bound — it only affects gameplay via a capped production penalty (max -60% at TD ≥ 200), but the raw TD value keeps accumulating forever. The Refactor button's cost is `100 * 1.1^TD`. Simulating the actual accrual formula from `App.tsx` over unattended real-world time:

| Scenario | TD | Refactor cost |
|---|---|---|
| 1 hour idle | 60 | 30,450 |
| 8 hours idle | 480 | 7.4e21 |
| 3 days idle, modest save (50 buildings) | 4,320 | 6.5e180 (finite but absurd) |
| 3 days idle, ~200 buildings | 12,960 | **Infinity** |
| 7 days idle | 30,240 | **Infinity** |

Once the cost overflows to `Infinity`, `disabled={gameState.loc < cost}` is permanently `true` regardless of how much LOC the player has — the Refactor button locks up and never responds again. This is a plausible explanation for "some parts of the UI stopped responding" after a long idle session, since LOC production itself doesn't depend on this formula and keeps ticking normally.

**Proposed fix**

Cap TD's effective growth for cost-calculation purposes (e.g. clamp the exponent input, or switch to a formula that can't blow past `Number.MAX_VALUE`, such as a piecewise/log-scaled cost past a threshold). Should not change balance for normal (non-multi-day-idle) play.

**Fix applied**

Added `REFACTOR_COST_TD_CAP = 1000` and a shared `getRefactorCost(td)` helper ([src/App.tsx](src/App.tsx)) that clamps the exponent input via `Math.min(td, REFACTOR_COST_TD_CAP)` before computing `100 * 1.1^td`. All 4 inline usages (cost calc, disabled check, class name check, cost display) now go through this helper. `1.1^1000 ≈ 2e41`, far below `Number.MAX_VALUE`, so the cost can never overflow regardless of how long TD accumulates.

**Verification**

Re-ran the Node simulation for the previously-overflowing scenarios (3/7/30 days idle at 200+ buildings) — cost now stays finite at ~2.47e43 in all cases instead of `Infinity`. `npm run build` succeeds.

**Superseded by BUG-010 (2026-10-29)**

The exponent cap kept the cost finite but not affordable. At TD 2,022 the cost is ~2.5e43 LOC, so the Refactor button is permanently disabled and the -60% penalty becomes a soft-lock. BUG-010 replaces the exponential formula with an income-based cost and caps TD at 200.

---

## BUG-002: Auto-save never actually fires

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-07-05, via code review while investigating the same unresponsive-game report.
- **Location:** [src/App.tsx:444-449](src/App.tsx#L444-L449)

**Description**

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    localStorage.setItem('codeTycoonEncryptedSave', encodeSave(gameState));
  }, 5000);
  return () => clearInterval(interval);
}, [gameState]);
```

`gameState` changes every ~100ms from the main game loop tick. Since it's in the dependency array, this effect's cleanup (`clearInterval`) runs and a brand new `setInterval` is created on every single tick — the 5-second interval is torn down and restarted roughly 10x/second, so the callback never survives long enough to fire. Auto-save has effectively never been running; the only real persistence path is manual export or whatever save existed when this effect was last (re)triggered before a page close.

This isn't the cause of the reported "unresponsive UI," but it means a long session with no manual save is at risk of complete progress loss if the tab crashes or closes.

**Fix applied**

Added a `gameStateRef` (`useRef`) kept in sync with `gameState` on every render, and changed the auto-save effect's dependency array to `[]` so the interval is created once on mount and reads `gameStateRef.current` inside the callback — same pattern the main game loop effect already used correctly.

**Verification**

`npm run build` succeeds; dev server restarted cleanly and serves the app. Effect now only mounts/unmounts once (on component mount/unmount) instead of ~10x/second, confirmed by code inspection of the new dependency array.

---

## BUG-003: Pre-existing TypeScript errors in `tsc --noEmit` (`npm run lint`)

- **Status:** fixed
- **Severity:** low (build via Vite/esbuild is unaffected; only `npm run lint` fails)
- **Found:** 2026-07-05, while verifying BUG-001/BUG-002 fixes via `npm run lint`.
- **Location:** [src/App.tsx:510-515](src/App.tsx#L510-L515) (`unknown` type from `Object.values(...).reduce(...)` without a typed accumulator) and [src/App.tsx:1267,1329](src/App.tsx#L1267) (`This expression is not callable. Type 'never' has no call signatures.`)

**Description**

Confirmed pre-existing (reproduced identically on `main` before this session's edits via `git stash`). `npm run lint` (`tsc --noEmit`) currently fails with 6 type errors unrelated to the TD/auto-save bugs. Doesn't block `npm run build` since Vite type-strips via esbuild without checking types, but it means the type-checker is currently useless as a safety net for this file.

**Fix applied**

- The `Object.values(...).reduce(...)` calls were inferring `unknown` (root cause: no `@types/react`/general TS inference quirk — see BUG-009). Fixed by explicitly typing the intermediate arrays: `const buildingCounts: number[] = Object.values(prev.buildingsOwned);` etc., then reducing over the explicitly-typed array.
- The two "never has no call signatures" errors were dead defensive code: `typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name` in the Boardroom/prestige-upgrade rendering, copy-pasted from the regular-upgrade rendering where `name` genuinely can be a function. `PrestigeUpgrade.name` is always `string`, so TS correctly narrowed the function-call branch to `never`. Simplified to `const name = upgrade.name;`.

**Verification**

`npm run lint` passes with zero errors.

---

## BUG-004: Malformed/corrupted save can permanently white-screen the app

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-07-06, Fable-model code review of the full codebase.
- **Location:** [src/App.tsx](src/App.tsx) save-loading paths (initial load, import), plus new [src/ErrorBoundary.tsx](src/ErrorBoundary.tsx)

**Description**

Save data was never validated after `JSON.parse`/base64-decode — the load path and the file-import path both blindly spread the parsed object over `DEFAULT_STATE`. `STAGES[gameState.stage]` is accessed unguarded in several render spots. A hand-edited or corrupted save with `stage` outside `0-7` makes that lookup `undefined`, and `.icon`/`.name` on `undefined` throws during render. With no error boundary anywhere, this was a full white-screen crash — and since the bad save is already in `localStorage`, reloading doesn't help; the in-app Hard Reset button is unreachable because the crash happens before Settings can render.

**Fix applied**

- Added `sanitizeGameState(raw: unknown): GameState` ([src/App.tsx](src/App.tsx)), which validates and clamps every field of a loaded/imported save (numbers must be finite, most must be non-negative, `stage` is clamped to `[0, STAGES.length - 1]`, `*Owned` fields must be plain objects), falling back to `DEFAULT_STATE`'s value per-field on anything malformed. Wired into all 3 places a save gets loaded: initial encrypted-save load, legacy plain-JSON fallback, and file import.
- Added `ErrorBoundary` ([src/ErrorBoundary.tsx](src/ErrorBoundary.tsx)), wrapping `<App />` in `main.tsx`, as a safety net for anything that still slips through (e.g. a future bug elsewhere). Its fallback UI offers "Reload" and "Clear Save & Reload" — the latter removes the `localStorage` save keys directly and reloads, so recovery doesn't depend on any React state being reachable.

**Verification**

Simulated the sanitizer against 10 malformed-input scenarios (out-of-range/negative/NaN `stage`, `null`/array `buildingsOwned`, negative/`Infinity` `loc`, empty object, `null` input) — all fall back safely to defaults; a normal valid save passes through unchanged. `npm run build` succeeds.

---

## BUG-005: Offline-progress effect isn't idempotent — double-awards LOC under React StrictMode in dev

- **Status:** fixed
- **Severity:** medium (dev-only; production build unaffected)
- **Found:** 2026-07-06, Fable-model code review.
- **Location:** [src/App.tsx:461-470](src/App.tsx#L461-L470)

**Description**

The "Offline progress and game loop" effect computes `earned` LOC synchronously in the effect body (not inside the interval callback) from the initial `gameState.lastSaved`, then calls `setGameState` — all inside a mount-once (`[]` deps) effect. `main.tsx` wraps the app in `<StrictMode>`, which intentionally double-invokes mount effects in development to surface exactly this class of impurity. Both invocations independently compute and award the same offline LOC, so `npm run dev` sessions show offline progress applied twice after being away. Production builds are unaffected since React only double-invokes in dev.

**Fix applied**

Added an `offlineProgressAppliedRef` (`useRef(false)`) guarding just the offline-progress-award block (not the game-loop interval setup below it, which already handles StrictMode correctly via its existing cleanup function). The ref flips to `true` on first run, so a second StrictMode invocation is a no-op for this part.

**Verification**

`npm run build` succeeds; code inspection confirms the interval setup/cleanup logic is untouched and still runs correctly on each invocation.

---

## BUG-006: Missing optional chaining on `prestigeUpgradesOwned` lookup

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-07-06, Fable-model code review.
- **Location:** [src/App.tsx:469](src/App.tsx#L469) (in the offline-progress calculation)

**Description**

`gameState.prestigeUpgradesOwned['remote_work']` was accessed without `?.`, unlike every other read of this field in the file (e.g. lines 644, 735, 1269 at the time of the review). A save with `prestigeUpgradesOwned` explicitly `null`/missing (same malformed-save class as BUG-004) would throw here, on mount, before anything else can render — one of the concrete ways BUG-004's crash could actually trigger.

**Fix applied**

Changed to `gameState.prestigeUpgradesOwned?.['remote_work']`, consistent with every other read of this field.

**Verification**

Also now covered defensively by BUG-004's `sanitizeGameState`, which guarantees `prestigeUpgradesOwned` is always a plain object by the time it reaches state — so this can no longer be `null`/`undefined` in practice either way.

---

## BUG-007: Same unguarded-exponent overflow pattern as BUG-001, in the generic building/upgrade cost formula

- **Status:** fixed
- **Severity:** low (much harder to trigger than BUG-001 was — needs ~10-15k owned of a slow-growing building)
- **Found:** 2026-07-06, Fable-model code review.
- **Location:** [src/App.tsx](src/App.tsx), `calculateCost` (used by `getBuildingCost`/`getUpgradeCost`)

**Description**

`calculateCost` computes `Math.pow(growthFactor, owned)` and `Math.pow(growthFactor, n)` with no bound. For the slowest-growing building (growth factor 1.07), this overflows to `Infinity` once `owned` reaches roughly 10-15k, permanently locking that purchase — the exact failure mode BUG-001 fixed for the Refactor cost, just requiring an absurd owned-count rather than idle wall-clock time to reach.

**Fix applied**

Added a `getSafePow(base, exponent)` helper that clamps the exponent per-`growthFactor` (`700 / Math.log(base)`) so the result can never exceed roughly `1e304`, comfortably below `Number.MAX_VALUE`, regardless of how large `owned`/`n` get. Replaced the 3 unguarded `Math.pow(growthFactor, ...)` call sites inside `calculateCost` with this helper. `getRefactorCost` (BUG-001's fix) is untouched — it already has its own, separately-verified cap.

**Verification**

`npm run build` succeeds. The cap scales correctly per growth factor (a fast grower like `code_reviews` at 2.0 gets a much lower safe exponent than a slow grower like `buddy` at 1.07), so no realistic gameplay scenario is affected.

---

## BUG-008: Dead `Save` icon import

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-07-06, Fable-model code review.
- **Location:** [src/App.tsx:5](src/App.tsx#L5)

**Description**

`Save` was imported from `lucide-react` but never rendered anywhere (confirmed via grep — only the English word "save" appears, in identifiers/strings like `codeTycoonSave`, `exportSave`). Harmless (tree-shaken by the bundler either way), but inconsistent with the AI-Studio-scaffold dependency cleanup from the previous session.

**Fix applied**

Removed `Save` from the `lucide-react` import list.

**Verification**

`npm run build` succeeds; bundle size unchanged (icon was already tree-shaken).

---

## BUG-009: No `@types/react`/`@types/react-dom` installed — TypeScript checking is largely inert for React APIs

- **Status:** open
- **Severity:** low-medium (deferred — not fixed this session, see below)
- **Found:** 2026-07-06, while debugging a `tsc` error in the new `ErrorBoundary.tsx` (BUG-004's fix).
- **Location:** `package.json` (missing devDependency), affects all of `src/`

**Description**

Neither `@types/react` nor `@types/react-dom` are installed anywhere in this project (`npm ls @types/react @types/react-dom` returns empty, and there's no vendored `.d.ts` for `react` in `node_modules/react`). Since `tsconfig.json` doesn't set `strict`/`noImplicitAny`, TypeScript silently treats the `react` import as an implicit `any` instead of erroring — which is why `npm run lint` mostly passes despite 1500+ lines of JSX: React-specific typing (props, JSX element types, `React.ElementType`, `React.ChangeEvent`, etc.) isn't actually being checked at all. This surfaced concretely when writing `ErrorBoundary.tsx`: `class X extends Component<Props, State>` couldn't infer `this.props` because `Component` itself resolves to `any`.

**Why not fixed now**

Installing `@types/react`/`@types/react-dom` and enabling real checking would very likely surface a batch of new type errors across the whole file (1500+ lines of previously "unchecked" JSX/React code) — an open-ended amount of work, not a targeted fix, and risks derailing tonight's goal of a working, playable build. Logged here instead of silently skipped so it doesn't get lost.

**Proposed fix (future session)**

Add `@types/react` and `@types/react-dom` as devDependencies matching the installed React 19 version, run `npm run lint`, and work through whatever surfaces as its own scoped pass — probably worth its own ticket/session rather than folding into an unrelated change.

---

## BUG-010: Technical Debt soft-locks the game - Refactor cost is unreachable, -60% penalty becomes permanent

- **Status:** fixed
- **Severity:** critical (unplayable save)
- **Found:** 2026-10-29, from a player screenshot: TD 2,022, Refactor cost shown as a long raw exponential float (~2.5e43 LOC), button permanently disabled, "SEVERE: -60% Prod, HQ progression blocked".
- **Location:** [src/App.tsx](src/App.tsx) - TD accrual in the game loop, `getRefactorCost`, `sanitizeGameState`, Refactor button

**Description**

Technical Debt only affects gameplay up to 200 (the last penalty tier, -60% production and blocked HQ progression), but the value itself had no cap. The Refactor cost was exponential: `100 * 1.1^TD`. BUG-001 capped the exponent so the result stays finite, but at TD 2,022 the cost is ~2.5e43 LOC, which no production curve in the game can reach. The only remaining recovery path was passive reduction from DevOps Engineers (-2 TD/min at 20 owned), roughly 15 hours of open-tab time at the worst penalty. That is a soft-lock, not a setback.

**Fix applied**

- Added `TD_MAX = 200` and clamped TD in the game loop and in `sanitizeGameState`. Existing saves above 200 are clamped on load; values above 200 had no gameplay effect anyway.
- Replaced the exponential cost with an income-based one: `getRefactorCost(state) = max(100, calculateProduction(state) * 30)`. Refactoring still removes 10 TD. The cost is always about 30 seconds of current production, so it scales with the company and remains payable at every stage.
- Removed `REFACTOR_COST_TD_CAP`, which is no longer needed.

**Verification**

- Node simulation of the loop: TD stops at 200; cost stays at 30 seconds of production; 20 refactors clear 200 TD; no overflow path remains.
- Browser test with a save at TD 2,022: TD loads as 200, Refactor shows a compact cost, is clickable, and reduces TD by 10 per click; HQ stays blocked at 200 and unblocks below it.
- `npm run lint` and `npm run build` pass.

---

## BUG-011: Numbers at or above 1Qa (1e15) render as raw floats

- **Status:** fixed
- **Severity:** low (display only)
- **Found:** 2026-10-29, in the same screenshot (the Refactor cost rendered as a long raw exponential float instead of a compact number).
- **Location:** [src/App.tsx](src/App.tsx) `formatNumber`

**Description**

`formatNumber` only handled K/M/B/T. Any value at or above 1e15 fell through to the raw JavaScript number, so costs and totals showed long floats or scientific notation (e.g. `2.5e43`, `1.21e58T`).

**Fix applied**

Replaced the formatter with a suffix table (`K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, UDc ... Vg`) and a scientific-notation fallback past the table. Handles rounding rollover (999,999 shows as 1.00M, not 1000.00K) and negative values.

**Verification**

Checked tier boundaries in Node (999, 1,000, 999,999, 1e15, 1e63, 1e70) and confirmed the compact cost in the browser test for BUG-010.
