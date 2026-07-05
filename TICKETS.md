# Code Tycoon — Tickets

Bug/issue tracker for local development. Each ticket has an ID, status, severity, and enough detail to pick up and fix independently.

Statuses: `open` → `in-progress` → `fixed` → `verified`

---

## BUG-001: Technical Debt cost formula overflows to Infinity on long idle sessions

- **Status:** fixed
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

- **Status:** open
- **Severity:** low (build via Vite/esbuild is unaffected; only `npm run lint` fails)
- **Found:** 2026-07-05, while verifying BUG-001/BUG-002 fixes via `npm run lint`.
- **Location:** [src/App.tsx:510-515](src/App.tsx#L510-L515) (`unknown` type from `Object.values(...).reduce(...)` without a typed accumulator) and [src/App.tsx:1267,1329](src/App.tsx#L1267) (`This expression is not callable. Type 'never' has no call signatures.`)

**Description**

Confirmed pre-existing (reproduced identically on `main` before this session's edits via `git stash`). `npm run lint` (`tsc --noEmit`) currently fails with 6 type errors unrelated to the TD/auto-save bugs. Doesn't block `npm run build` since Vite type-strips via esbuild without checking types, but it means the type-checker is currently useless as a safety net for this file.

**Proposed fix**

Type the `reduce` accumulators explicitly (e.g. `.reduce((a: number, b: number) => a + b, 0)`) and investigate the two "never has no call signatures" sites — likely a lookup into a typed map/union that TS has narrowed to `never`.
