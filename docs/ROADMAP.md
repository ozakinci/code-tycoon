# Code Tycoon — Roadmap

**Status:** planning reference  
**Last updated:** 2026-11-07  
**Current release:** v0.0.7

This roadmap is deliberately outcome-based. It avoids dates and separates committed bug fixes from ideas that need a design decision. The idea parking lot is [BACKLOG.md](../BACKLOG.md); this file is the prioritized plan.

Companion documents: [GDD.md](GDD.md) · [TECH.md](TECH.md) · [BALANCE.md](BALANCE.md) · [DECISIONS.md](DECISIONS.md) · [PLAYTEST.md](PLAYTEST.md)

---

## Principles

- Fix trust and correctness before adding content.
- Make the existing loop legible before making it bigger.
- Expand sideways through identity, story and choices, not Stage 8–12 inflation.
- Keep the two-currency model, dark zinc/emerald identity, no-backend design and current content scale.
- Every feature needs an observable acceptance criterion.
- Decision-dependent work waits for the owner’s answer; it is not silently implemented.

## Status legend

| Label | Meaning |
|---|---|
| Done | Shipped and verified in the current release |
| Next | Ready to start; no design decision required |
| Needs decision | Requires an owner answer before implementation |
| Later | Valuable, but lower priority or dependent on earlier work |
| Non-goal | Explicitly not planned for the personal version |

---

## Phase 0 — Correctness and trust (Done in v0.0.7)

**Outcome:** no known progress-loss, NaN/Infinity, accidental-wipe or background-tab exploit.

| Item | Status | Evidence |
|---|---|---|
| Temporary TD outages instead of permanent building deletion; weighted selection; auto-recovery; “Fix now” | Done | `App.tsx`, outage test, design doc |
| Deep save validation: nested counts, unknown IDs, clamps, save version | Done | `sanitizeGameState`, 8 sanitizer tests |
| Live tick cap + hidden-tab offline rules | Done | `calculateOfflineProgress`, visibility handler |
| Prestige payout inside the functional updater; confirmation modal | Done | `handlePrestige`, prestige modal |
| Import preview and confirmation; download current save first | Done | `pendingImport`, import modal |
| Equipment “Requires a hire” instead of “Maxed at 0 hires” | Done | `isUpgradeLocked` |
| TD net rate, next threshold, progress bar, outage banner | Done | TD panel |
| Per-unit and total building production; equipment summary | Done | Team/Upgrades tabs |
| Current vs next upgrade descriptions; corrected brand/stock/perk text | Done | Upgrade cards |
| “LOC This Run” vs “Lifetime LOC” labels | Done | Main stats and Settings |
| Safe localStorage wrapper and warning | Done | `storage`, Settings |
| Modal overflow and accessibility fixes | Done | `role="dialog"`, `max-h-[90vh]`, labels |
| React types, strict TypeScript, Vitest tests | Done | `package.json`, `tsconfig.json`, `App.test.ts` |
| Lint and tests gate deployment | Done | `.github/workflows/deploy.yml` |

**Exit criteria met:** `npm run lint`, `npm test` (19 tests) and `npm run build` pass. A manual playtest of the new modals and outage flow is still recommended; see [PLAYTEST.md](PLAYTEST.md).

---

## Phase 1 — Foundation (Next)

**Outcome:** adding content or changing formulas no longer requires editing a 2,000-line file, and the economy can be tuned with evidence.

| Item | Status | Notes |
|---|---|---|
| Extract `src/game/data.ts` | Needs decision | Behaviour-preserving module split; owner comfort question |
| Extract `src/game/formulas.ts` | Needs decision | Includes cost, production, click, AC, TD, offline |
| Extract `src/game/save.ts` | Needs decision | Defaults, encode/decode, sanitizer, migrations |
| Extract `src/game/useGameState.ts` | Needs decision | State, loop, actions |
| Extract UI components | Needs decision | Top bar, TD panel, tabs, cards, modals |
| Add content validation tests | Next | Unique IDs, valid stages, reachable content, sane values |
| Add save migration pipeline | Next | `version` exists; migrations do not |
| Add a balance simulator | Next | Greedy player; time-to-stage, TD, AC |
| Single version source | Next | Read version from package/build instead of hardcoding |
| Add component tests | Later | After module split; Testing Library or Playwright |
| Add PWA shell | Later | Installable, offline app shell, update flow |

**Exit criteria:** same gameplay and save compatibility; files focused; a new building/upgrade is a data-only change that passes validation; tests cover the economy and save format.

**Decision gate:** question 5 (refactor comfort). If the answer is “not now,” skip the split and do the data validation, simulator and version source in place.

---

## Phase 2 — Feel and clarity (Next after Phase 1 or in parallel where safe)

**Outcome:** a new player knows what to do, every production change is explainable, and milestones feel like events.

| Item | Status | Notes |
|---|---|---|
| Production breakdown | Next | Base → milestones → equipment → tech → perks → TD |
| Milestone progress + toast | Next | “Next: 25 owned (×2)” and a celebration |
| Unlock banners | Next | New building/upgrade/stage announcements |
| First-run quest line | Next | Mirrors click → hire → upgrade → refactor → stage → sell |
| Achievements | Needs decision | Data-driven, 40–60, gallery and toasts |
| Stats page | Next | Clicks, playtime, peak LOC/s, refactors, outages survived |
| Offline report detail | Next | Time away, tier applied, effective rate |
| Automation unlocks | Needs decision | Auto-buy, auto-refactor; timing and cost matter |
| Click/milestone juice | Later | CSS/rAF effects, optional sound, reduced motion |
| Readability pass | Next | Larger-text option, focus states, colour-independent affordability |
| Visual HQ evolution | Later | CSS/emoji/illustration; high kid appeal |

**Exit criteria:** a first-time player reaches the first sale without external help; every production drop is explainable; there are goals beyond the next purchase.

**Decision gate:** questions 1 and 2 (audience priority and run length) determine how much guidance and automation to add.

---

## Phase 3 — Sideways scenario expansion (Needs decision)

**Outcome:** runs have identity and choices; the existing stages feel deeper, not just longer.

| Item | Status | Notes |
|---|---|---|
| Founder origins | Needs decision | 3 choices; small bonuses and quirks |
| Stage story beats | Needs decision | One short choice per stage-up |
| Buyer choice at sale | Needs decision | 2–3 offers with tradeoffs |
| Event deck | Needs decision | 20–30 satirical events, 2–3 choices each |
| Codex / company handbook | Needs decision | Lore unlocks; player-facing glossary |
| Named employees / roster flavour | Needs decision | Milestone-generated names and quirks |
| Specializations at Stage 3 | Needs decision | B2B, consumer, open source, AI lab |
| Multiple endings | Needs decision | IPO, acquisition, open source, collapse, singularity |
| Hardware/tooling path + synergies | Needs decision | Give AI/Cloud/Quantum their own identity |
| Company history | Needs decision | Generated timeline of runs |

**Suggested order if approved:** founder origins → buyer choice → stage beats → event deck → codex/names → specializations → endings.

**Exit criteria:** two runs can feel different; the prestige decision is a tradeoff; the satire has room; no new currency is added.

**Decision gate:** question 4 (preferred scenario direction). Do not build all options at once.

---

## Phase 4 — Polish and share (Later)

**Outcome:** the game is comfortable to share with family and close friends.

| Item | Status | Notes |
|---|---|---|
| PWA/manifest/icons/service worker | Later | High value if tablet is a target |
| Visual HQ evolution | Later | CSS/emoji first; no full art pipeline |
| Cosmetic office decorations | Later | Optional identity |
| Seasonal/holiday event toggles | Later | Off by default; no FOMO |
| Accessibility audit | Later | Screen reader, keyboard, contrast |
| Playtest with kid/friends and tune | Ongoing | The strongest evidence |
| Shared save codes | Later | No backend; export/import is enough for now |

**Exit criteria:** installable if wanted, readable, delightful and stable; the owner is comfortable sharing it.

---

## Later / only if it earns its place

- Post-Stage-7 content (Stage 8–12): use sparingly; vertical stages are the easiest but least interesting expansion.
- Second-order prestige currency: only if the first prestige loop is exhausted and the new layer changes rules, not just numbers.
- Rival company / market share: interesting, but can add pressure; keep it optional/cosmetic first.
- Alternate modes (speedrun, hardcore, sandbox, weekly challenge): good for friends after the core game is polished.
- Leaderboards/cloud saves: no backend for now; use export/share codes if needed.
- Localization, monetization, ads: not planned.

## Non-goals

- No backend, accounts, cloud sync, analytics or leaderboards for the personal version.
- No monetization, ads, energy timers or dark patterns.
- No framework or state-library rewrite.
- No full art pipeline.
- No 20 new buildings just to inflate the content count.
- No infinite vertical stages without a narrative or mechanical reason.
- No silent balance changes during a documentation/bug-fix release.

## Release checklist

Before any release:

- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` succeeds.
- [ ] Save compatibility checked (load an old save, export, import).
- [ ] New user-visible text matches the formulas.
- [ ] `CHANGELOG.md` updated.
- [ ] `TICKETS.md` updated for every fixed bug.
- [ ] `BALANCE.md` updated for every economy change.
- [ ] In-game design doc updated if player-facing mechanics changed.
- [ ] A short playtest or smoke test completed.

## Decision gates

| Question | Blocks | Default used until answered |
|---|---|---|
| Who is the next iteration for? | Guidance, automation, difficulty | Kid-friendly clarity |
| How long should a run take? | Pacing, offline caps, content volume | Short sessions, deeper weekend run |
| Is tablet/mobile first-class? | PWA, layout, touch targets | Usable but desktop-first |
| Which scenario direction? | Phase 3 | None; scenario work stays documented only |
| Is a module split welcome? | Phase 1 | No split yet; fix in place |
