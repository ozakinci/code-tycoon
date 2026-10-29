# Code Tycoon

An idle/clicker game about turning a garage side project into a galactic software empire. Click to write Lines of Code (LOC), hire a team, buy upgrades, grow the HQ, then sell the company for permanent Founder Perks.

Live build: https://ozakinci.github.io/code-tycoon/

## How it plays

- Click **Write Code** to earn LOC, then hire your first College Buddy.
- Buildings produce LOC per second; upgrades multiply production, click power, or equipment bonuses.
- Grow the HQ through 8 stages, from Mom's Garage to Orbital Station, to unlock better hires and buyers.
- From Stage 2 you can sell the company for Acquisition Capital (AC), spend it on permanent Founder Perks, and start again stronger.
- Technical Debt builds while the tab is open. It cuts production and eventually blocks HQ upgrades until you refactor.

## Features

- 12 buildings, 22 upgrades, 6 prestige upgrades, 8 HQ stages.
- Technical Debt system with penalty tiers, random building shutdowns, and a Refactor action.
- Offline progress with diminishing returns after 30, 120 and 240 minutes, extended by the Remote Work Policy perk.
- Save game in localStorage every 5 seconds, plus file export, import and hard reset.
- Save validation and an error boundary, so a corrupted save cannot white-screen the game.
- Compact number formatting up to Vg, scientific notation beyond.

## Stack

React 19, TypeScript, Vite 6, Tailwind CSS 4, lucide-react. No backend and no external API. The game runs entirely in the browser.

## Run locally

Requires Node.js.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build and deploy

```bash
npm run build   # production build in dist/
npm run lint    # TypeScript check
npm run preview # serve the production build
```

Every push to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`.

## Project structure

- `src/App.tsx` - game state, formulas, game loop, and UI.
- `src/designDoc.ts` - design document shown in the in-game settings.
- `src/index.css` - Tailwind import and global styles.
- `src/ErrorBoundary.tsx`, `src/main.tsx` - app entry and crash recovery.
- `TICKETS.md` - bug tracker with root cause, status and fix details.
- `BACKLOG.md` - planned mechanics and content.
- `CHANGELOG.md` - release history.

## Save format

Saves are Base64-encoded JSON with a one-character shift, stored under `codeTycoonEncryptedSave`. Export writes the same encoded text to a `.txt` file. Stored and imported saves pass through validation before they reach the game state.
