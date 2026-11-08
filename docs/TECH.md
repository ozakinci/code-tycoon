# Code Tycoon — Technical Documentation

**Status:** current implementation reference  
**Last updated:** 2026-11-07  
**Version:** v0.0.7

Companion documents: [GDD.md](GDD.md) · [BALANCE.md](BALANCE.md) · [ROADMAP.md](ROADMAP.md) · [DECISIONS.md](DECISIONS.md)

---

## 1. Technical goals

- Run entirely in the browser, with no backend, accounts, analytics or external API.
- Keep the game playable from a static GitHub Pages build.
- Make saves durable and recoverable: validate untrusted data, autosave, export/import, crash recovery.
- Keep the existing React/Vite/Tailwind stack; no framework or state-library rewrite.
- Add tests around the economy and save format before any structural refactor.
- Stay small enough for one person to maintain.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| UI | React 19.2 | Function components, hooks, functional state updates |
| Language | TypeScript 5.8 | Strict mode enabled |
| Build | Vite 6.4 | Static SPA build |
| Styling | Tailwind CSS 4.1 | Utility classes in `App.tsx` |
| Icons | lucide-react | Tree-shaken SVG icons |
| Tests | Vitest 5.1 | Node environment, no DOM component tests yet |
| Runtime | Node 22.12+ | Required by Vitest 5; CI uses Node 22 |
| Persistence | localStorage + file export | No server |
| Hosting | GitHub Pages | `.github/workflows/deploy.yml` |

## 3. Repository map

```
index.html                 App shell
src/main.tsx               React root, StrictMode, ErrorBoundary
src/App.tsx                Types, data, formulas, state, loop, save logic and UI (~2,040 lines)
src/App.test.ts            19 unit tests for save sanitizer, encoding, costs, formatting, milestones, AC, offline tiers and outages
src/ErrorBoundary.tsx      Render-crash recovery UI
src/designDoc.ts           Player-facing design document shown inside Settings
src/index.css              Tailwind import
vite.config.ts             React + Tailwind plugins, base path /code-tycoon/
.github/workflows/deploy.yml  Lint, test, build and deploy to GitHub Pages
docs/                      Design, technical, research, balance, content, roadmap, playtest and decision docs
TICKETS.md                 Bug and issue history
CHANGELOG.md               Release history
BACKLOG.md                 Uncommitted idea parking lot
```

`App.tsx` is still a monolith. That is a known maintainability limit, not an accidental architecture. The behaviour-preserving split is planned in [ROADMAP.md](ROADMAP.md), but is deferred until the owner confirms it is welcome.

## 4. Runtime flow

1. `index.html` loads `/src/main.tsx`.
2. `main.tsx` mounts `<App />` inside `<StrictMode>` and `<ErrorBoundary>`.
3. `App` initializes:
   - buy amount from `codeTycoonBuyAmount`;
   - game state from `codeTycoonEncryptedSave`, falling back to legacy `codeTycoonSave`, then `DEFAULT_STATE`;
   - every candidate save passes through `sanitizeGameState`.
4. A mount-once effect handles offline progress and starts the 100 ms game loop.
5. A separate mount-once effect autosaves every 5 seconds from `gameStateRef.current`.
6. UI actions use functional `setGameState(prev => ...)` updates so rapid clicks cannot read stale state.

## 5. State model

```ts
interface GameState {
  version: number;
  loc: number;
  totalLoc: number;          // earned this run; drives AC
  lifetimeLoc: number;       // all runs
  buildingsOwned: Record<string, number>;
  upgradesOwned: Record<string, number>;
  stage: number;             // index into STAGES
  ac: number;
  prestigeUpgradesOwned: Record<string, number>;
  prestigeCount: number;
  lastSaved: number;         // epoch ms
  technicalDebt: number;     // 0..200
  outages: Record<string, number>; // building id -> epoch ms when service returns
}
```

`DEFAULT_STATE` is exported for tests. The current save version is `SAVE_VERSION = 1`.

## 6. Game loop

- Interval: 100 ms.
- Foreground delta: `min(max(elapsed, 0), 1)` seconds. A throttled timer cannot award minutes in one tick.
- Hidden tab: the interval returns immediately. On `visibilitychange` to visible, the hidden interval is awarded through the offline tier function.
- Long foreground stalls (laptop sleep, tab freeze) also use the offline tier function instead of being discarded by the tick cap.
- Initial load: elapsed time since `lastSaved` is awarded through the same offline function if greater than 5 seconds. The welcome-back modal appears only above 60 seconds.
- Production is recalculated from state each tick; it is not cached.
- TD accrual/reduction and outage rolls happen in the same tick.
- React StrictMode double-invocation is guarded with `offlineProgressAppliedRef`.

### Outage selection

- Outages only roll when no outage is active and TD is at least 50.
- Chance per second: `0.005` at TD 50–99, `0.02` at TD 100+.
- A building is selected from owned types with probability proportional to owned count.
- Expiry is `now + 30_000` ms. Expired entries are removed on the next tick.
- Outaged buildings contribute zero production but keep their owned counts.
- “Fix now” clears the outage map immediately.

## 7. Economy formulas

Exact formulas and tuning notes live in [BALANCE.md](BALANCE.md). The important implementation rules:

- All exponential cost calculations go through `getSafePow`, which clamps the exponent so costs cannot reach `Infinity`.
- Bulk purchases sum each level’s cost.
- `calculateCost` supports `1`, `10`, `50`, `100`, `next` and `max`, with optional max levels.
- Prestige payout is computed from `prev` inside the functional updater.
- All production, click and AC calculations are exported or pure helpers where practical, so Vitest can test them without mounting the UI.

## 8. Save format and validation

### Storage keys

| Key | Purpose |
|---|---|
| `codeTycoonEncryptedSave` | Current autosave/export format |
| `codeTycoonSave` | Legacy plain-JSON fallback |
| `codeTycoonBuyAmount` | Last selected buy amount |

### Encoding

1. `JSON.stringify(state)`
2. `encodeURIComponent`
3. `btoa`
4. Shift each character code by +1

Decoding reverses the shift, decodes Base64/URI and parses JSON. This is obfuscation for casual cheating deterrence, not encryption.

### Sanitization rules

`sanitizeGameState(raw: unknown)` treats every source as untrusted:

- top-level input must be a plain object;
- `loc`, `totalLoc`, `lifetimeLoc`, `ac` must be finite and non-negative;
- `stage` is floored and clamped to `0..STAGES.length - 1`;
- `technicalDebt` is clamped to `0..200`;
- `prestigeCount` is floored and non-negative;
- `lastSaved` must be finite and is clamped to `0..now`;
- `buildingsOwned` keeps known IDs only; counts must be finite, non-negative integers, capped at 1e9;
- `upgradesOwned` keeps known IDs only and caps each entry at its static max, its dynamic max (equipment = hires; brands = stage), or 1e6;
- `prestigeUpgradesOwned` keeps known IDs and caps at the perk max or 1e6;
- `outages` keeps at most one known building, ignores expired entries, and clamps expiry to `now + 30 s`;
- unknown and malformed fields fall back to defaults.

The sanitizer is not a migration system. `version` is currently rewritten to 1 on load; future schema changes need a migration pipeline before the sanitizer.

## 9. Error handling

- `ErrorBoundary` catches render-time crashes and offers:
  - Reload;
  - Clear Save & Reload (wrapped in try/catch for unavailable storage).
- `storage` wraps `getItem`, `setItem` and `removeItem` in try/catch.
- A failed autosave sets a non-blocking warning in Settings.
- Invalid imports show an alert and do not replace the current save.
- Valid imports show a preview and require confirmation.

## 10. UI structure

`App.tsx` contains one screen with:

- sticky top bar: stage, next HQ, settings;
- compact top console: four equal-width side cells (LOC balance + run total, per-second/per-click output, Technical Debt info, and Refactor) around a centered Write Code action; the TD info cell carries penalty, net rate, next threshold, progress bar and outage banner;
- on screens below `lg`, the console stacks into balance + action, rates, then Technical Debt (the info and Refactor cells sit side by side from the `sm` breakpoint and stack on phones);
- three tabs: Team, Upgrades, Boardroom;
- modals: settings/stats, prestige confirmation, import confirmation, offline report.

Current UX guarantees:

- modal containers use `max-h-[90vh]` and internal scrolling;
- modal roots use `role="dialog"`, `aria-modal="true"` and labels;
- icon-only buttons have `aria-label`/`title`;
- upgrade text distinguishes current and next-level effects;
- building cards distinguish per-unit and total production;
- equipment shows equipped/hires counts and the human multiplier.

No routing, animation framework, sound system or PWA layer is present.

## 11. Testing

```bash
npm test        # Vitest one-shot
npm run test:watch
npm run lint    # tsc --noEmit, strict
npm run build   # production build
```

The 20 tests cover:

- top-level and nested save sanitization, including unknown IDs, strings, negatives, NaN, Infinity, huge values, equipment-over-hire and brand-over-stage clamping;
- outage sanitization and production exclusion without deletion;
- save encode/decode round-trip and garbage input;
- linear, exponential, bulk, max and next cost calculations;
- compact number formatting, fractional rate formatting and milestone multipliers;
- prestige payout and buyer multipliers;
- offline tier math with and without Remote Work;
- finite defaults.

Not covered yet: React component rendering, click handlers, modal focus management, end-to-end save flows. These are candidates for Playwright or Testing Library once a module split makes components independently mountable.

## 12. Build and deployment

- `npm run build` produces `dist/` through Vite.
- `vite.config.ts` sets `base: '/code-tycoon/'` for GitHub Pages.
- Every push to `main` runs `npm ci`, `npm run lint`, `npm test`, `npm run build`, then publishes `dist/` via GitHub Pages.
- Tests and type-checking therefore gate deployment as of v0.0.7.

## 13. Performance

- Production and cost math are O(number of buildings/upgrades), which is trivial at the current scale.
- The whole state updates every 100 ms while visible. React re-renders the screen at that rate; this is acceptable at the current content size.
- Hidden tabs skip ticks, avoiding unnecessary work.
- The largest performance risk is future visual polish (animations, many cards), not the economy.

## 14. Known limitations

- `App.tsx` mixes data, formulas, persistence, state and UI.
- Content tables are code constants, not runtime-validated data.
- Save versioning exists, but there is no migration pipeline.
- The version badge is hardcoded in `App.tsx` as well as `package.json`.
- No PWA/service worker; installability and offline app-shell loading are not available.
- No component/e2e tests.
- No automated balance simulator.
- No localization layer.
- Accessibility is improved but not audited with a screen reader.

## 15. Planned technical work

See [ROADMAP.md](ROADMAP.md) for priority. The behaviour-preserving split is:

1. `src/game/data.ts` — types, content constants, stage tables.
2. `src/game/formulas.ts` — cost, production, click, AC, TD and offline helpers.
3. `src/game/save.ts` — defaults, encode/decode, sanitizer, version/migrations.
4. `src/game/useGameState.ts` — state, loop, actions.
5. `src/components/` — top bar, stats, TD panel, tabs, cards, modals.

Do not change behaviour during the split. Keep save compatibility and run the full test suite after each extraction.

## 16. Conventions

- Use functional state updates for anything derived from previous state.
- Never trust imported or stored data.
- Keep formulas pure and testable.
- Prefer small, named helpers over inline math.
- Treat TypeScript strict errors as release blockers.
- Update `CHANGELOG.md` for every user-visible change and `TICKETS.md` for every bug fix.
- Do not add a backend, analytics or monetization without an explicit decision entry.
