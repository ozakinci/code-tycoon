# Code Tycoon — Documentation

This folder holds the durable design, technical and planning references. `TICKETS.md`, `CHANGELOG.md` and `BACKLOG.md` stay at the repository root for visibility.

| Document | Purpose | Update when |
|---|---|---|
| [GDD.md](GDD.md) | Vision, pillars, loop, systems, content inventory, open questions | A player-facing rule or content system changes |
| [TECH.md](TECH.md) | Stack, architecture, state, loop, saves, tests, deployment, limitations | Code structure, persistence or tooling changes |
| [RESEARCH.md](RESEARCH.md) | Idle-game research, sources and implications | New research or a playtest changes an assumption |
| [BALANCE.md](BALANCE.md) | Exact formulas, tuning knobs, pacing observations, balance log | Any economy value or formula changes |
| [CONTENT_BIBLE.md](CONTENT_BIBLE.md) | Voice, naming, current catalogue, scenario/event seeds | Content is added or a tone rule is set |
| [ROADMAP.md](ROADMAP.md) | Phased outcomes, acceptance criteria, decision gates, non-goals | Priorities or decisions change |
| [PLAYTEST.md](PLAYTEST.md) | Test script, observation checklist, feedback log, triage rubric | A playtest session is run |
| [DECISIONS.md](DECISIONS.md) | ADR-style record of durable decisions | A decision is made or reversed |

## Source-of-truth rules

- **Values and formulas:** `src/App.tsx` is authoritative. Docs are snapshots and explanations.
- **Bugs and fixes:** `TICKETS.md` at the root.
- **Releases:** `CHANGELOG.md` at the root.
- **Uncommitted ideas:** `BACKLOG.md` at the root. The roadmap is the prioritized plan; the backlog is the parking lot.
- **Version:** `package.json` and the in-game badge must match until a single version source is implemented.

## Maintenance rules

1. A balance change updates `BALANCE.md` and `CHANGELOG.md`.
2. A content addition updates `GDD.md`, `CONTENT_BIBLE.md`, and the content validation test once it exists.
3. An architectural or design decision updates `DECISIONS.md`.
4. A playtest updates `PLAYTEST.md` with observations, not just opinions.
5. Keep the README short and link here instead of duplicating the full docs.
6. Keep the in-game design doc player-facing; full details belong in this folder.

## Release checklist

Run `npm run lint`, `npm test` and `npm run build`; smoke-test save load/export/import; update the changelog and tickets; then deploy. The full checklist is in [ROADMAP.md](ROADMAP.md).
