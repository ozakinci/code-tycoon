# Code Tycoon — Backlog

This is an **idea parking lot**, not a roadmap. Nothing here is committed. Items are kept because they might add value later; some may never be built. The prioritized plan and decision gates live in [docs/ROADMAP.md](docs/ROADMAP.md).

## How to use this file

- Add ideas here when they are not yet prioritised.
- Move an idea to the roadmap only when it has a clear outcome, acceptance criteria and an owner decision (if needed).
- Do not treat a checkbox as a promise.
- Completed work belongs in [CHANGELOG.md](CHANGELOG.md); fixed bugs belong in [TICKETS.md](TICKETS.md).

## Recently completed or rejected

- Technical Debt soft-lock and permanent building deletion — fixed in v0.0.6/v0.0.7. See TICKETS.md.
- Save validation, background-tab consistency, prestige/import confirmations, mobile modal fixes — v0.0.7.
- Purchase-efficiency / buy-quantity UI — dropped; the 1/10/50/100/next/max buttons are the intended design.
- Monetization, ads, energy timers, analytics, backend/cloud saves — rejected for the personal version.
- Stage 8–12 inflation — not planned unless a future decision reverses ADR-010.

---

## Mechanics and systems

- [ ] **Random positive events** — golden-cookie-style spawn every 45–120s; temporary boost or instant LOC; missing it costs nothing.
- [ ] **Bug outbreak** — click a building 10–30 times to repair; if ignored, production drops temporarily (never deletes).
- [ ] **Code Sprint** — player-activated 30–60s production/click burst with a 5–10 min cooldown; limited charges.
- [ ] **Diminishing returns** — taper Stock Options, soft-cap global multipliers, increase building growth after 50/25 owned, stepped upgrade costs.
- [ ] **Building role identity and synergies** — hardware/tooling path for AI/Cloud/Quantum; Scrum + Junior, Senior + Architect, AI + Cloud bonuses; equipment set bonus.
- [ ] **Click scaling path** — raise the 1% of LOC/s added to click power toward 3–5% via an upgrade.
- [ ] **First-sale AC guarantees** — at least 1 AC on the first Stage 2 sale, +3 on Stage 3, +10 on Stage 4.
- [ ] **Automation unlocks** — auto-buy and/or auto-refactor as late/prestige rewards; decide whether automation removes too much play.
- [ ] **Achievements and quests** — data-driven achievements, gallery, toasts, first-run checklist. Needs a scope decision.
- [ ] **Stats page** — total clicks, playtime, peak LOC/s, refactors, outages survived, best run.
- [ ] **Second-order prestige currency** — only after the first prestige loop is exhausted; must change rules, not just numbers.
- [ ] **Company specializations** — B2B, consumer, open source, AI lab; modest bonuses and different events/buyers.

## Content and narrative

- [ ] **Post-Stage-7 stages** — Stage 8–12 only if a narrative or mechanical reason emerges. Keep the current eight-stage arc as the default.
- [ ] **Late-game buildings/upgrades** — StackOverflow Oracle, Quantum Coffee Machine, Reality Linter, Legacy COBOL Oracle, Sentient Build Server, Alien Pair Programmer, Blockchain Consultant, etc. Add one or two at a time.
- [ ] **Flavor events** — Billionaire Tweet, Framework of the Week, Cloud Bill Shock, TechCrunch Interview, Hackathon, Open Source Rival.
- [ ] **Seasonal content** — Hacktoberfest, Programmer’s Day (day 256), April Fools; opt-in, no FOMO.
- [ ] **Founder origins** — CS Dropout, MBA Graduate, Open Source Veteran; small starting bonuses and quirks.
- [ ] **Stage story beats** — one short choice per stage-up; no long dialogue.
- [ ] **Buyer choice** — 2–3 offers with AC/quirk tradeoffs at sale time.
- [ ] **Multiple endings** — IPO, acquisition, open source, collapse, singularity; based on run choices/stats.
- [ ] **Codex / company handbook** — glossary, lore unlocks, buyer/ending entries.
- [ ] **Named employees** — milestone-generated names, quirks and one-line bios; optional roster flavor.
- [ ] **Company history** — generated timeline of runs, buyers, best run, biggest outage.
- [ ] **Alternate modes** — speedrun, hardcore, sandbox, weekly challenge; after the core game is polished.
- [ ] **Cosmetics** — office themes, building skins, achievement badges/titles, optional sound.
- [ ] **Major systems** — rivals/market share, product launches, R&D lab, marketing resource. Lowest priority; only if the core loop needs a second wind.

## Technical and polish

- [ ] **Behaviour-preserving module split** — data/formulas/save/state/components; awaits owner comfort decision (ADR-008).
- [ ] **Content validation tests** — unique IDs, valid stages, reachable content, sane values.
- [ ] **Save migration pipeline** — `version` exists; migrations do not.
- [ ] **Balance simulator** — greedy player; time-to-stage, TD, AC; dev tool, not shipped.
- [ ] **Single version source** — read from package/build instead of hardcoding the badge.
- [ ] **PWA / installability** — manifest, icons, service worker, auto-update; high value if tablet is a target.
- [ ] **Visual HQ evolution** — CSS/emoji/illustration per stage; no full art pipeline yet.
- [ ] **Accessibility audit** — screen reader, keyboard focus, contrast, reduced motion, larger-text option.
- [ ] **Component/e2e tests** — Testing Library or Playwright after the module split.
- [ ] **Localization** — only if the game is shared beyond the current audience.

## Open decisions that gate ideas

These are tracked in [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/ROADMAP.md](docs/ROADMAP.md):

1. Who is the next iteration for — kid, friends, or owner?
2. How long should a satisfying run take?
3. Is tablet/mobile a first-class target?
4. Which scenario direction should come first?
5. Is a behaviour-preserving module split welcome now?

Until these are answered, prefer small clarity fixes and playtesting over large new systems.
