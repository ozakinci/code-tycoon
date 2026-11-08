# Code Tycoon — Decision Log

**Status:** ADR-style record of durable decisions  
**Last updated:** 2026-11-07

This file records decisions that should not be quietly reversed. Each entry states the context, the decision, and the consequences. “Accepted” means implemented or binding; “Proposed” means documented but awaiting the owner’s answer.

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Personal-first, no backend, no monetization, no analytics | Accepted |
| ADR-002 | Keep the two-currency model and current content scale | Accepted |
| ADR-003 | Technical Debt outages are temporary and recoverable | Accepted |
| ADR-004 | Strict TypeScript, focused tests, and CI gates | Accepted |
| ADR-005 | Versioned, deeply sanitized saves | Accepted |
| ADR-006 | Destructive actions require confirmation | Accepted |
| ADR-007 | Hidden tabs use offline progression rules | Accepted |
| ADR-008 | Keep the single-file `App.tsx` for now | Accepted (review trigger) |
| ADR-009 | Documentation set and source-of-truth rules | Accepted |
| ADR-010 | Expand sideways, not vertically | Proposed |
| ADR-011 | Hold economy tuning until playtest evidence | Accepted |
| ADR-012 | Keep the 0.0.x version scheme | Accepted |

---

## ADR-001: Personal-first, no backend, no monetization, no analytics

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** Code Tycoon is built for the owner, their kid and close friends. A backend, accounts, cloud saves, ads or analytics would add cost, privacy risk and maintenance without improving the core experience.

**Decision:** Keep the game a static client-side app. No backend, accounts, cloud sync, analytics, ads, purchases, energy timers or dark patterns. Share through GitHub Pages, save files and word of mouth.

**Consequences:**
- The game works offline after first load (eventually via PWA) and can be hosted for free.
- Saves are local and can be lost if the browser storage is cleared; export/import is the backup path.
- No usage data. Balance decisions rely on playtests, not telemetry.
- Any future leaderboard or cloud save requires a new decision entry.

**Alternatives considered:** Supabase/Firebase accounts, analytics, a paid “premium” tier. Rejected for scope, privacy and trust.

---

## ADR-002: Keep the two-currency model and current content scale

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** The game already has a coherent economy: LOC for the run, AC for permanent perks. Adding currencies or a large vertical content expansion would increase complexity without a proven need.

**Decision:** Keep LOC + AC. Keep the current 8 stages, 12 buildings, 22 upgrades and 6 Founder Perks as the content scale for now. Expand through depth and choices, not a larger count.

**Consequences:**
- New content must justify itself as a decision, story beat or identity, not just a bigger number.
- Stage 8–12 and a second prestige currency are explicitly not planned unless a future decision reverses this.
- The game remains learnable in one session.

---

## ADR-003: Technical Debt outages are temporary and recoverable

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** Before v0.0.7, high TD randomly deleted buildings permanently. The UI called it a “shutdown,” the design doc implied recovery, and a single rare building could vanish. For a family game, random permanent loss is the wrong kind of pressure.

**Decision:** At 50+ TD, one building type can go offline for 30 seconds. Production from that type is zero. The outage recovers automatically or can be fixed immediately. Buildings are never deleted. Selection is weighted by owned count, and only one outage is active at a time.

**Consequences:**
- TD remains a real penalty (production loss and HQ block) without destroying trust.
- The outage needs visible UI: banner, countdown, “Fix now,” and card state. This is implemented.
- The save format carries an `outages` map, validated on load.
- The chance/duration are balance knobs; changing them does not change the “never delete” rule.

**Alternatives considered:** permanent loss (rejected), no random outages (possible later), click-to-repair minigame (deferred).

---

## ADR-004: Strict TypeScript, focused tests, and CI gates

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** TypeScript checking was largely inert because React types were missing and strict mode was off. A 2,000-line game file with no tests made every change risky.

**Decision:** Install `@types/react`, `@types/react-dom` and Vitest. Enable `strict`, `noFallthroughCasesInSwitch` and `noImplicitOverride`. Test the save sanitizer, formulas, formatting, milestones, prestige and offline tiers. Run lint and tests before deployment.

**Consequences:**
- `npm run lint` is a real safety net.
- `npm test` is fast and runs in CI.
- Component/e2e tests are still missing; the module split is the prerequisite for cheap component tests.
- New code must not introduce `any` escape hatches to silence the checker.

---

## ADR-005: Versioned, deeply sanitized saves

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** The old sanitizer checked top-level fields and that nested objects were objects, but trusted their values. Strings, negatives, NaN, Infinity, unknown IDs and oversized counts could produce broken economies or crashes.

**Decision:** Treat every save as untrusted. Add a save `version`, validate every nested count, drop unknown IDs, clamp equipment to hires and brands to stage, clamp TD, lastSaved and prestige count, and sanitize outages. Invalid input falls back to a playable default.

**Consequences:**
- A corrupt or hand-edited save cannot white-screen the game or create NaN/Infinity costs.
- The sanitizer is a safety net, not a migration system. Future schema changes need explicit migrations.
- Save compatibility is tested through encode/decode and sanitizer cases.

---

## ADR-006: Destructive actions require confirmation

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** Prestige and import both replace the current run. A single misclick could erase progress, and a fast double-click could award AC twice.

**Decision:** Prestige opens a confirmation modal listing what resets and what is kept; the payout is computed inside the state updater. Import opens a preview comparing current and imported progress, with a “Download Current Save First” option.

**Consequences:**
- Two extra clicks before a wipe; this is intentional.
- The modals must remain readable on small screens.
- Hard reset remains a separate, explicit danger-zone action.

---

## ADR-007: Hidden tabs use offline progression rules

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** Browser timers throttle in hidden tabs. The old loop used uncapped elapsed time, so leaving a tab open earned full-rate production while closing it was capped. That inverted the idle-game promise.

**Decision:** Cap live ticks at 1 second. While hidden, do not run the economy. On return, award the hidden interval through the same 100/50/20% offline tiers as a closed tab.

**Consequences:**
- Background and closed-tab progression are consistent.
- Players who relied on an open background tab will earn less; this is the intended fix.
- The offline tier function is shared by initial load and visibility return, so the rules cannot drift.

---

## ADR-008: Keep the single-file `App.tsx` for now

**Date:** 2026-11-07  
**Status:** Accepted (review trigger: before the next large content system)

**Context:** `App.tsx` is about 2,040 lines and mixes data, formulas, saves, state and UI. A split would improve maintainability, but it is a large behaviour-preserving change and the owner has not said whether that churn is welcome.

**Decision:** Do not split the file in v0.0.7. Keep fixes small and in place. Document the proposed split and revisit before adding a large content system or when the file becomes painful to change.

**Consequences:**
- v0.0.7 stays low-risk and reviewable.
- The monolith remains the main maintainability limitation.
- Tests around formulas and saves reduce the risk of a future split.

**Review trigger:** the owner answers the refactor-comfort question, or a feature would touch more than ~300 lines of shared state/UI.

---

## ADR-009: Documentation set and source-of-truth rules

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** The project had a README, in-game design doc, tickets, changelog and a backlog that mixed session notes with ideas. There was no single place for design intent, technical architecture, research, balance or decisions.

**Decision:** Create a lean `docs/` set: GDD, TECH, RESEARCH, BALANCE, CONTENT_BIBLE, ROADMAP, PLAYTEST and DECISIONS. Keep `TICKETS.md` and `CHANGELOG.md` at the root for visibility. Reduce `BACKLOG.md` to an idea parking lot.

**Consequences:**
- Code remains the source of truth for values; docs explain intent and must be updated when behaviour changes.
- The roadmap is separate from uncommitted ideas.
- The in-game design doc stays player-facing and short.
- Documentation maintenance is part of the release checklist.

---

## ADR-010: Expand sideways, not vertically

**Date:** 2026-11-07  
**Status:** Proposed — needs owner decision

**Context:** The current eight-stage arc is readable. Stage 8–12 would be the easiest expansion but would add number inflation without new decisions. Founder origins, stage beats, buyer choice, events, specializations, codex and endings would deepen the existing fantasy.

**Decision (proposed):** Prioritize sideways scenario content. Treat Stage 8–12 and a second prestige currency as later options only if they earn their place.

**Consequences if accepted:**
- Content work focuses on identity, story and choice.
- The two-currency model and current stage count remain stable.
- More authoring work per feature; less raw number growth.
- The owner’s preferred scenario direction still determines the first feature.

**Alternatives:** More stages, more buildings, a second prestige layer, or no scenario expansion. All remain valid until the owner chooses.

---

## ADR-011: Hold economy tuning until playtest evidence

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** The review identified real balance outliers (TD curve, Corporate Synergy, 10x Culture, Code Reviews, offline caps, AC jumps). Changing them together with trust/UI fixes would make it impossible to tell what improved or worsened the game.

**Decision:** v0.0.7 changes no cost, production, AC or perk-effect values. It only removes permanent loss, makes hidden-tab progress consistent, and corrects descriptions to match the existing formulas. Balance changes wait for a playtest and one-at-a-time experiments.

**Consequences:**
- The economy stays stable while the player’s trust is rebuilt.
- Known outliers remain documented in [BALANCE.md](BALANCE.md).
- A future balance release must state its hypothesis and update the balance log.

---

## ADR-012: Keep the 0.0.x version scheme

**Date:** 2026-11-07  
**Status:** Accepted

**Context:** The history was renumbered on 2026-10-29: v1.0.0 became v0.0.1, v1.1.0 became v0.0.5. The in-game badge and package version use 0.0.x.

**Decision:** Keep 0.0.x for personal releases. Increment the patch for fixes and small features; use a minor bump only for a substantial content/system release.

**Consequences:**
- Version numbers reflect the personal, iterative nature of the project.
- The in-game badge, `package.json`, changelog and release tag must be updated together.
- The UI currently hardcodes the badge; a single version source is planned.

---

## Adding a decision

Use this template:

```
## ADR-XXX: Short title

**Date:** YYYY-MM-DD
**Status:** Proposed / Accepted / Superseded by ADR-YYY

**Context:** What problem or choice prompted this?

**Decision:** What was decided?

**Consequences:** What becomes easier, harder, or forbidden?

**Alternatives considered:** What was rejected and why?
```

A decision that changes player-visible behaviour should also update the GDD, balance log or changelog as appropriate.
