# Code Tycoon

An idle/clicker game about turning a garage side project into a galactic software empire. Click to write Lines of Code (LOC), hire a team, buy upgrades, grow the HQ, then sell the company for permanent Founder Perks.

Live build: https://ozakinci.github.io/code-tycoon/

## How it plays

- Click **Write Code** to earn LOC, then hire your first College Buddy.
- Buildings produce LOC per second; upgrades multiply production, click power, or equipment bonuses.
- Grow the HQ through 8 stages, from Mom's Garage to Orbital Station, to unlock better hires and buyers.
- From Stage 2 you can sell the company for Acquisition Capital (AC), spend it on permanent Founder Perks, and start again stronger.
- Technical Debt builds while the tab is open. It cuts production, can cause temporary building outages, and at 200 blocks HQ upgrades until you refactor. Outages recover automatically after 30 seconds or can be fixed immediately; buildings are never deleted.

## Features

- 12 buildings, 22 upgrades, 6 prestige upgrades, 8 HQ stages.
- Technical Debt system with penalty tiers, temporary and repairable building outages, and a Refactor action.
- Offline progress with diminishing returns after 30, 120 and 240 minutes, extended by the Remote Work Policy perk. Hidden tabs and long foreground stalls use the same rules as a closed game.
- Save game in localStorage every 5 seconds, plus file export, import preview and confirmation, and hard reset.
- Deep save validation and an error boundary, so a corrupted save cannot white-screen the game or create NaN/Infinity values.
- Prestige confirmation with a clear reset/keep summary and protection against double payouts.
- TD net rate, next penalty threshold, progress bar, outage banner and “Fix now”.
- Team equipment summary, per-unit/total building production, and current vs next upgrade effects.
- Compact number formatting up to Vg, scientific notation beyond.

## Stack

React 19, TypeScript (strict), Vite 6, Tailwind CSS 4, lucide-react, Vitest. No backend and no external API. The game runs entirely in the browser.

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build and deploy

```bash
npm run build   # production build in dist/
npm run lint    # strict TypeScript check
npm test        # Vitest unit tests
npm run preview # serve the production build
```

Every push to `main` runs lint, tests and the production build, then publishes to GitHub Pages through `.github/workflows/deploy.yml`.

## Project structure

- `src/App.tsx` - game state, formulas, game loop, and UI.
- `src/App.test.ts` - unit tests for saves, formulas, formatting, prestige and offline progress.
- `src/designDoc.ts` - player-facing design document shown in the in-game settings.
- `src/index.css` - Tailwind import and global styles.
- `src/ErrorBoundary.tsx`, `src/main.tsx` - app entry and crash recovery.
- `docs/` - full design, technical, research, balance, content, roadmap, playtest and decision docs. Start at `docs/README.md`.
- `TICKETS.md` - bug tracker with root cause, status and fix details.
- `BACKLOG.md` - uncommitted ideas and an idea parking lot (not a roadmap).
- `CHANGELOG.md` - release history.

## Documentation

- `docs/GDD.md` - game design document and open questions.
- `docs/TECH.md` - architecture, save format, testing and deployment.
- `docs/BALANCE.md` - formulas, tuning knobs and balance observations.
- `docs/ROADMAP.md` - planned phases, decision gates and non-goals.
- `docs/PLAYTEST.md` - test script and feedback log.
- `docs/DECISIONS.md` - durable decision record.

## Save format

Saves are versioned Base64-encoded JSON with a one-character shift, stored under `codeTycoonEncryptedSave`. Export writes the same encoded text to a `.txt` file. Stored and imported saves pass through deep validation before they reach the game state. Importing shows a current-vs-imported preview and requires confirmation; the app also offers to download the current save first.
