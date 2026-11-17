# AGENTS.md

Guidance for agents working in this repository.

## Project

An idle/clicker game that turns a garage side project into a software empire. React 19, TypeScript, Vite 6 and Tailwind CSS 4. The game runs entirely in the browser: no backend, no external API. Every push to `main` builds and publishes to GitHub Pages.

## Files

- `src/App.tsx` - game state, formulas, game loop and UI.
- `src/designDoc.ts` - the design document shown in the in-game settings.
- `TICKETS.md` - bug tracker: root cause, status and fix per bug.
- `BACKLOG.md` - planned mechanics and content.
- `CHANGELOG.md` - release history.
- `index.html`, `src/index.css`, `src/ErrorBoundary.tsx`, `src/main.tsx` - entry, styles and crash recovery.

## Commands

```powershell
npm.cmd install
npm.cmd run dev       # http://localhost:3000
npm.cmd run build     # production build in dist/
npm.cmd run lint      # TypeScript check (tsc --noEmit)
npm.cmd run preview   # serve the production build
```

## Rules

- Keep the game logic where it already lives (`src/App.tsx`). Split only when the file becomes unworkable, and say so.
- A save is Base64-encoded JSON with a one-character shift, stored under `codeTycoonEncryptedSave`. Stored and imported saves pass through validation before they reach game state. Never weaken that path: a corrupted save must not white-screen the game.
- When a formula, balance number or game rule changes, update the matching text in `src/designDoc.ts` and add a `CHANGELOG.md` entry in the same change.
- Log every fixed bug in `TICKETS.md` with its root cause and the fix. Planned work goes in `BACKLOG.md`, not in the README.
- `npm.cmd run lint` must pass before a push, because a push publishes immediately.
- No backend and no external API. Keep the build a static bundle.

## Session startup

1. **Project memory** - this file is auto-loaded; use it directly.
2. **README freshness** - check that `README.md` matches the current features, stack and commands; update it when they drift.
3. **Clock in / clock out** - this project defines no extra start or end steps; the global blocks apply as-is.
