# AGENTS.md

Guidance for agents working in this repository.

## Project

An idle/clicker game that turns a garage side project into a software empire. React 19, TypeScript, Vite 6 and Tailwind CSS 4. The game runs entirely in the browser: no backend, no external API. Every push to `main` builds and publishes to GitHub Pages.

## Files

- `src/App.tsx` - game state, formulas, game loop and UI. Authoritative for every value and formula.
- `src/App.test.ts` - vitest coverage of the game rules.
- `src/designDoc.ts` - the player-facing design document shown in the in-game settings.
- `docs/` - durable design and planning docs (GDD, TECH, RESEARCH, BALANCE, CONTENT_BIBLE, ROADMAP, PLAYTEST, DECISIONS). [`docs/README.md`](docs/README.md) is the index and carries the source-of-truth and maintenance rules; read it before editing any doc.
- `TICKETS.md`, `BACKLOG.md`, `CHANGELOG.md` - bug tracker, parking lot and release history. These stay at the root.
- `index.html`, `src/index.css`, `src/ErrorBoundary.tsx`, `src/main.tsx` - entry, styles and crash recovery.

## Commands

```powershell
npm.cmd install
npm.cmd run dev       # http://localhost:3000
npm.cmd run build     # production build in dist/
npm.cmd run lint      # TypeScript check (tsc --noEmit)
npm.cmd test          # vitest run
npm.cmd run preview   # serve the production build
```

## Rules

- Keep the game logic where it already lives (`src/App.tsx`). Split only when the file becomes unworkable, and say so.
- A save is Base64-encoded JSON with a one-character shift, stored under `codeTycoonEncryptedSave`. Stored and imported saves pass through validation before they reach game state. Never weaken that path: a corrupted save must not white-screen the game.
- When a formula, balance number or game rule changes, update `BALANCE.md`, the matching text in `src/designDoc.ts` and a `CHANGELOG.md` entry in the same change. A player-facing content addition also updates `GDD.md` and `CONTENT_BIBLE.md`, in the same change.
- A durable architectural or design decision gets an entry in `docs/DECISIONS.md`.
- Log every fixed bug in `TICKETS.md` with its root cause and the fix. Planned work goes in `BACKLOG.md`, not in the README.
- Lint, test and build must pass before a push, because a push publishes immediately.
- No backend and no external API. Keep the build a static bundle.
- `package.json` and the in-game version badge must match.

## Session startup

1. **Project memory** - this file is auto-loaded; use it directly.
2. **README freshness** - check that `README.md` matches the current features, stack and commands; update it when they drift.
3. **Clock in / clock out** - this project defines no extra start or end steps; the global blocks apply as-is.
