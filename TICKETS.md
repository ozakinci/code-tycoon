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

- **Status:** fixed
- **Severity:** low-medium
- **Found:** 2026-07-06, while debugging a `tsc` error in the new `ErrorBoundary.tsx` (BUG-004's fix).
- **Fixed:** 2026-11-07
- **Location:** `package.json`, `tsconfig.json`, all of `src/`

**Description**

Neither `@types/react` nor `@types/react-dom` were installed anywhere in this project (`npm ls @types/react @types/react-dom` returned empty, and there was no vendored `.d.ts` for `react` in `node_modules/react`). Since `tsconfig.json` didn't set `strict`/`noImplicitAny`, TypeScript silently treated the `react` import as an implicit `any` instead of erroring — which is why `npm run lint` mostly passed despite 1500+ lines of JSX. React-specific typing (props, JSX element types, `React.ElementType`, `React.ChangeEvent`, etc.) wasn't actually being checked at all.

**Fix applied**

- Installed `@types/react@^19`, `@types/react-dom@^19` and Vitest (currently 5.1).
- Enabled `strict`, `noFallthroughCasesInSwitch` and `noImplicitOverride` in `tsconfig.json`.
- Fixed the errors that real React types exposed: added an explicit `string` return type to `formatNumber` and `override` modifiers in `ErrorBoundary`.
- The `ErrorBoundary` no longer declares `props` manually; the React types now infer it correctly.

**Verification**

`npm run lint` passes with strict TypeScript. `npm test` runs 19 tests, and `npm run build` succeeds. The deploy workflow now runs lint and tests before building.

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

---

## BUG-012: High Technical Debt permanently deletes buildings

- **Status:** fixed
- **Severity:** critical (progress loss)
- **Found:** 2026-11-07, code review of the TD game-loop block.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) game loop, TD shutdown block; TD panel; save sanitizer

**Description**

At TD ≥ 50, each tick rolled a random chance (1%/s at 50–99 TD, 5%/s at 100+) to pick an owned building type uniformly and decrement its count permanently. The UI and design document called the event a “shutdown,” which implied recovery, but the building was simply gone. At 100+ TD the expected loss was roughly three buildings per minute. A single rare Quantum Computer could be deleted while hundreds of College Buddies were untouched, and leaving a high-TD tab open could erase an hour of progress. For a family game, this was the most player-hostile behavior in the build.

**Fix applied**

- Replaced permanent deletion with an `outages: Record<string, number>` map (building id → expiry timestamp).
- At 50+ TD, one building type can go offline for 30 seconds. Chance is 0.005/s at 50–99 TD and 0.02/s at 100+.
- Selection is weighted by owned count, so a single rare building is less likely to be chosen than a common one.
- Only one outage is active at a time. It recovers automatically, or the player can press “Fix now”.
- Outaged buildings contribute zero production; their owned counts never change.
- The TD panel shows the building name, countdown and repair action. Building cards show “Outage — 0 LOC/s”.
- The save sanitizer keeps at most one known outage, drops expired/unknown entries and clamps expiry to 30 seconds in the future.
- The in-game design document now describes temporary outages.

**Verification**

- Added a unit test that confirms an outaged building has zero production, retains its owned count, and recovers after expiry.
- Added sanitizer tests for unknown, expired and implausibly distant outage entries.
- `npm run lint`, `npm test` (19 tests) and `npm run build` pass.
- A manual in-browser check at TD 50+ is still part of the v0.0.7 playtest.

---

## BUG-013: Save sanitizer trusted nested `*Owned` values

- **Status:** fixed
- **Severity:** high (broken economy/crash risk)
- **Found:** 2026-11-07, code review of `sanitizeGameState`.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) `sanitizeGameState`, initial load, import path

**Description**

The old sanitizer checked that `buildingsOwned`, `upgradesOwned` and `prestigeUpgradesOwned` were objects, but not that their values were valid numbers. A save with `{ "buddy": "abc" }`, negative counts, `NaN`, `Infinity`, unknown IDs or an oversized brand level could produce NaN production, negative costs, free purchases or infinite values. The game could appear to run while every number became unusable, and a crash could make the in-app reset unreachable.

**Fix applied**

- Every nested count must be a finite, non-negative integer; zero and malformed values are dropped.
- Unknown building/upgrade/perk IDs are ignored.
- Building counts are capped at 1e9.
- Upgrade counts are capped by their static max, dynamic max (equipment = current hires; brands = stage) or 1e6.
- Prestige counts are capped by perk max or 1e6.
- `stage` is floored and clamped to the valid range; `technicalDebt` is clamped to 0–200; `prestigeCount` is floored; `lastSaved` is finite and clamped to 0–now.
- Saves gain a `version: 1` field.
- Equipment is clamped to the sanitized hire count, so a save cannot retain more keyboards than people.

**Verification**

- Eight sanitizer tests cover non-object input, out-of-range stage/TD, strings, negatives, zero, NaN, Infinity, unknown IDs, fractional counts, equipment-over-hire, brand-over-stage, perk maxima, outages and malicious values.
- A round-trip test confirms encode/decode preserves a valid save.
- `npm run lint`, `npm test` and `npm run build` pass.

---

## BUG-014: Background tabs bypassed offline caps; short reloads lost progress

- **Status:** fixed
- **Severity:** high (economy consistency)
- **Found:** 2026-11-07, code review of the game loop and visibility behavior.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) offline progress and game-loop effect

**Description**

The game loop computed `dt` from `Date.now()` without a cap. A hidden tab throttled to one tick per minute could therefore award a full minute of production per tick at 100% rate, while closing the tab was capped by the offline rules. This punished the idle behavior the game is named for. Separately, the initial offline award only fired after 60 seconds, so short reloads lost a few seconds of progress.

**Fix applied**

- Added a shared `calculateOfflineProgress(prodPerSec, secondsOffline, remoteWorkLevel)` used by both initial load and visibility return.
- Capped each live tick at 1 second (`MAX_LIVE_TICK_SECONDS`).
- While `document.hidden`, the interval does not run the economy.
- On `visibilitychange` to visible, the hidden interval is awarded through the offline tiers.
- Initial loads award elapsed time after 5 seconds; the welcome-back modal appears only above 60 seconds.
- Kept the `offlineProgressAppliedRef` guard for React StrictMode.

**Verification**

- Offline tier tests cover 1 minute, 30 minutes, 2 hours, 10,000 seconds and Remote Work I.
- `npm run lint`, `npm test` and `npm run build` pass.
- A manual hidden-tab check is part of the v0.0.7 playtest.

---

## BUG-015: Prestige could double-pay; prestige and import had no confirmation

- **Status:** fixed
- **Severity:** high (progress loss / economy exploit)
- **Found:** 2026-11-07, code review of `handlePrestige` and the import flow.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) `handlePrestige`, Boardroom, import handler and modals

**Description**

`handlePrestige` calculated `acGained` from the render-time `gameState` outside the functional updater. A fast double-click could run the handler twice before React applied the first update, awarding AC twice and incrementing the prestige count twice. The “Accept Acquisition” button also wiped the run immediately, with no summary of what would be lost. Importing a save replaced the current company immediately, with no preview or backup.

**Fix applied**

- Moved AC calculation inside `setGameState(prev => ...)`. The second invocation sees stage 0 and becomes a no-op.
- Added a prestige confirmation modal listing payout, what resets (LOC, buildings, upgrades, HQ, TD, outages) and what is kept (perks, AC, lifetime LOC, acquisition count).
- Added an import preview comparing current and imported stage/LOC/AC and requiring confirmation.
- Added “Download Current Save First” to the import modal.
- Closing/replacing a save also closes the prestige/import modals.

**Verification**

- `npm run lint`, `npm test` and `npm run build` pass.
- The double-click guard is guaranteed by the functional updater logic; a manual click test is part of the playtest.

---

## BUG-016: Equipment appears “Maxed” when the player has zero hires

- **Status:** fixed
- **Severity:** medium (new-player confusion)
- **Found:** 2026-11-07, code review of dynamic max levels.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) equipment upgrades and Upgrades tab filters

**Description**

`eq_keyboard`, `eq_coffee` and `eq_chair` use `maxLevel: (state) => getTotalHires(state)`. At zero hires the max is 0, so the old filter treated the equipment as exhausted and displayed “Maxed” before the player could possibly use it.

**Fix applied**

- Added `isUpgradeLocked` (dynamic max ≤ 0) and `isUpgradeMaxed` (max > 0 and level ≥ max).
- Locked equipment remains visible as a disabled card with “Requires a hire”.
- Exhausted technologies now only include genuinely maxed upgrades.

**Verification**

- Type-check and build pass.
- A fresh-save visual check is included in the playtest.

---

## BUG-017: Misleading labels, per-unit production and upgrade descriptions

- **Status:** fixed
- **Severity:** low-medium (comprehension)
- **Found:** 2026-11-07, content/UX review.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) top stats, Settings, building cards, upgrade/perk cards and content descriptions

**Description**

Several labels did not match the underlying values:

- “Total LOC Written” showed `totalLoc` (this run) on the main screen, while Settings used the same label for `lifetimeLoc`.
- Building cards showed `+X LOC/s` without saying it was per unit, not the total for the owned count.
- Equipment bonuses were invisible as a team-wide fraction.
- Many upgrade/perk descriptions previewed the next level without saying “Next”, and some were off by one (equipment brands) or described a different formula (Stock Options, Code Reviews, Corporate Synergy).
- TD had no net rate, next threshold or outage cause.

**Fix applied**

- Renamed the main stat to “LOC This Run”; Settings shows “Lifetime LOC” and “LOC This Run”.
- Building cards show `+X LOC/s each`, total output for owned units, and outage state.
- Added a team-equipment summary (keyboards/coffee/chairs equipped, total hires, human multiplier).
- Added TD net rate, next penalty threshold, progress bar, outage banner and repair action.
- Upgrade cards show “Current: …” and “Next level: …” where they differ; perk cards do the same.
- Corrected equipment brand, Stock Options, Code Reviews, Corporate Synergy, Founder’s Network, Angel Investor, Remote Work, Brand Recognition and 10x Culture descriptions to match their formulas.
- Updated the in-game design document.

**Verification**

- Formatting/milestone tests pass; lint, test and build pass.
- Visual wording checks are part of the playtest.

---

## BUG-018: localStorage exceptions could break autosave or recovery

- **Status:** fixed
- **Severity:** medium (save reliability)
- **Found:** 2026-11-07, robustness review.
- **Fixed:** 2026-11-07
- **Location:** `localStorage` calls in [src/App.tsx](src/App.tsx) and [src/ErrorBoundary.tsx](src/ErrorBoundary.tsx)

**Description**

`localStorage.getItem`/`setItem`/`removeItem` can throw in private browsing, when storage is disabled, or when the quota is exceeded. The autosave callback and the ErrorBoundary’s clear-save action did not catch those errors, so a storage failure could crash the loop or the recovery path.

**Fix applied**

- Added a `storage` wrapper with try/catch for get/set/remove.
- Failed writes set a non-blocking warning in Settings: automatic saving is unavailable; export manually.
- Loads fall back to defaults when storage cannot be read.
- The ErrorBoundary clear-save action is wrapped in try/catch and still reloads.

**Verification**

- Lint/test/build pass.
- A private-browsing/storage-disabled check is part of the playtest.

---

## BUG-019: Modals could overflow; icon-only buttons lacked labels

- **Status:** fixed
- **Severity:** medium (mobile/accessibility)
- **Found:** 2026-11-07, UX review.
- **Fixed:** 2026-11-07
- **Location:** [src/App.tsx](src/App.tsx) Settings, prestige, import and offline modals; top bar

**Description**

The Settings modal had no max-height or internal scrolling, so Save Data and Danger Zone could be unreachable on a short phone. Several icon-only controls (settings gear, close buttons) had no accessible name, and dialogs lacked dialog semantics.

**Fix applied**

- Modal containers use `max-h-[90vh]` with `overflow-y-auto`; Settings uses a flex column with a scrollable body.
- Modal roots use `role="dialog"`, `aria-modal="true"` and an `aria-label`.
- Icon-only buttons have `aria-label`/`title`.
- The top HQ button has a descriptive label including cost or TD-blocked state.

**Verification**

- Lint/test/build pass.
- A 360×640 viewport and keyboard tab-order check is part of the playtest.

---

## BUG-020: Prestige confirmation used contradictory “lifetime progress this run” wording

- **Status:** fixed
- **Severity:** low (copy clarity)
- **Found:** 2026-11-08, during the scripted browser walkthrough of the prestige flow.
- **Fixed:** 2026-11-08
- **Location:** [src/App.tsx](src/App.tsx) prestige confirmation modal

**Description**

The confirmation said “It is worth 1.00B LOC of lifetime progress this run.” `totalLoc` is LOC earned during the current run, while “lifetime” means all runs combined. The sentence contradicted itself and could imply the payout used lifetime LOC.

**Fix applied**

The modal now reads “The offer is based on the 1.00B LOC you earned this run.”

**Verification**

The browser walkthrough checks that the new wording appears and the contradictory phrase is gone. Lint, unit tests and the production build pass.
