# Code Tycoon — Backlog

## Session notes — where we left off (2026-07-05)

**Done this session:** cloned the repo from GitHub into this local folder and set up two-way sync; cut all ties with Google AI Studio (removed unused deps `@google/genai`/`express`/`dotenv`/`better-sqlite3`/`motion`, AI Studio scaffold files, orphaned `App.v1*.tsx` snapshots); fixed BUG-001 (Technical Debt/Refactor cost could overflow to `Infinity` after days idle) and BUG-002 (auto-save effect never actually fired due to a bad dependency array) — see `TICKETS.md`; refreshed `designDoc.ts` to match the current code; set up GitHub Pages deployment (auto-publishes on every push to `main` via `.github/workflows/deploy.yml`) — **the game is now live at https://ozakinci.github.io/code-tycoon/**.

**Next time: move to the mr-fit multi-agent workflow.** We looked at how `mr-fit` (a sibling project) is set up — six project-scoped Claude Code subagents (`project-manager`, `main-dev`, `tester`, `documenter`, `technical-documenter`, `code-reviewer`) coordinated by `project-manager` as the sole point of contact, with ticket-enforced commits (`commit-msg` git hook requiring a ticket ID), an automated post-commit review/test hook (needs the `claude` CLI on PATH — **confirmed installed** for this machine), and a persistent `project/agent-log.md` for continuity across sessions. Decisions made so far:
1. `claude` CLI is installed, so the post-commit automation hook (code-reviewer + tester running in the background after every commit) can actually fire here, unlike the gap mr-fit's own docs flag for plain VSCode-extension setups.
2. Plan to set up a genuinely separate sibling `tester` project (its own repo/package.json/Playwright suite, black-box HTTP-only testing) — not built yet.
3. Confirmed: `project-manager` will get the `Agent` tool to spawn the other subagents (same capability-escalation sign-off mr-fit required).
4. Everything else (ticket-tagged commits, versioned requirements, ADRs, agent-log) ports over the same way, adapted to this project's stack (React/Vite instead of Vue/Pinia).
5. **New idea to fold in (not yet in mr-fit either):** add a `researcher` agent — researches a topic/question, reports findings back to `project-manager`, who then routes actionable results to the right specialist (e.g. `main-dev` to implement). The user wants this pattern added to mr-fit too, but that's a separate repo we don't touch from here.

Start next session by setting up `.claude/agents/` (project-manager, main-dev, tester, documenter, technical-documenter, code-reviewer, researcher), `project/` (requirements.md, tickets.md, roadmap.md, agent-log.md), and `.githooks/` (commit-msg, post-commit), mirroring mr-fit's structure.

---

Source: `Code_Tycoon_Implementation_Instructions.txt`. Ideas below are grouped as in the original doc; each top-level item has a status checkbox.

## Game Mechanic Upgrades

- [x] **1. Implement Technical Debt system** — done, see `src/App.tsx` (`technicalDebt` state, `getTDAcquisitionMultiplier`, `getTDReductionPerSec`, `getTDPenaltyMultiplier`, Refactor button, DevOps Engineer / Code Reviewer buildings).
  - Buildings/upgrades drive TD accrual (passive rate scaled by building/upgrade counts rather than a flat +1/+0.5 per purchase — equivalent idle-game framing of the same rule), plus passive time-based accrual.
  - Penalty thresholds implemented exactly: 10 TD = -5%, 25 TD = -10%, 50 TD = -20% (+ shutdown chance), 100 TD = -40% (+ higher shutdown chance), 200 TD = -60% and blocks further HQ stage progression.
  - "Refactor" button present: cost = `100 * 1.1^TD`, removes 10 TD per use.
  - DevOps Engineer (Stage 1, ~75,000 cost) reduces TD/sec; Code Reviewer (Stage 2, ~500,000 cost) reduces TD accumulation rate up to 50% at max stack.
  - Senior Developer and Software Architect each apply a flat -2% TD-generation reduction.

- [ ] **2. Add purchase-efficiency and prestige-clarity UI**
  - Cost-per-LOC/sec and payback time on every building/upgrade; highlight best current purchase.
  - Near Sell Company: "AC if sold now" and "time to next AC tier."
  - Buy x1 / x10 / x25 / Max buttons.

- [ ] **3. Add active-play events** (requires Technical Debt system — already available)
  - Golden-Cookie-style random pop-up every 45–120s, ~30s of production or short multiplier reward, no penalty for missing it.
  - Bug Outbreak: random building drops to 0% production until clicked back to life (10–30 clicks), every 5–15 min of active play.

- [ ] **4. Add manually-triggered production burst ability ("Code Sprint")**
  - Player-activated, 30–60s duration, 2–5x production and/or click power.
  - Cooldown 5–10 min, limited charges that regenerate over time.

- [ ] **5. Add diminishing returns / soft caps**
  - Stock Options: taper multiplier from x1.5 toward x1.12 by level 5 instead of flat compounding.
  - Global production multipliers: soft-cap exponent above 1000x (`1000 * (multiplier/1000)^0.65`).
  - Building costs: incrementally increase growth factor after 50 owned (early-tier) / 25 owned (late-tier).
  - Upgrade level costs: stepped scaling — levels 1-5 normal, 6-10 x1.5, 11-15 x2.0, 16-20 x3.0.

- [ ] **6. Add building role identity and synergy bonuses**
  - Dedicated upgrade path for AI Code Generator, Cloud Server Farm, Quantum Computer (currently get nothing from the Equipment tree).
  - Synergy bonuses: Scrum Master + Junior Developers; Senior Developer + Software Architect; AI Code Generator + Cloud Server Farm.
  - Equipment set bonus for maxing Keyboard/Coffee/Chair counts relative to total hires.

- [ ] **7. Extend the clicking scaling formula**
  - Upgrade path raising "% of Total LOC/sec added to Click Power" from 1% baseline toward 3–5%.

- [ ] **8. Add remaining UI/QoL features**
  - Production breakdown tooltip (base → equipment → upgrades → TD penalty → event modifiers).
  - Stats tab: lifetime LOC, total clicks, prestige count, time played, peak LOC/sec.
  - Toast notifications for events/milestones.
  - Large-number formatting (K/M/B/T/Qa/Qi...) with scientific-notation toggle.
  - Auto-save every 30s; "last saved Xs ago"; import preview before overwrite.

- [ ] **9. Add first-sale AC guarantees**
  - Guarantee ≥1 AC on first Stage 2 sale; +3 bonus AC on first Stage 3 sale; +10 bonus AC on first Stage 4 sale.

- [ ] **10. Technical/architecture cleanup (low priority)**
  - Move game state to `useReducer` or a lightweight state library once `useState` becomes hard to manage.
  - Use `requestAnimationFrame` for UI animations instead of the fixed game-loop tick.
  - Change save export/import to JSON with a version field, keeping Base64 as fallback.

## Content Upgrades

- [ ] **1. Add Post-Stage-7 progression stages**
  - Stage 8 — The Singularity Node, Stage 9 — Planetary Kernel, Stage 10 — Dyson Cloud, Stage 11 — Galactic SaaS Platform, Stage 12 — Reality Compiler.
  - Each new stage adds exactly one new building or upgrade, not a new system.

- [ ] **2. Add a second-order prestige currency**
  - New currency (e.g. "Singularity Points") unlocked after reaching the final stage a set number of times or a very high lifetime AC total.
  - Spend on meta-perks that modify base formulas/starting conditions, not just flat multipliers.

- [ ] **3. Add new late-game buildings and upgrades**
  - Buildings: StackOverflow Oracle, Quantum Coffee Machine, Reality Linter, Time-Traveling Debugger/CTO, Legacy COBOL Oracle, Sentient Build Server, Distributed Intern Hive, Alien Pair Programmer, Blockchain Consultant, Celebrity Developer, Metaverse Team, Neural Link Lab, Dyson Sphere Compute Array, Multiverse Git Repository.
  - Upgrades: Rewrite in Rust / Rewrite Back to JavaScript (paired comedy upgrades), AI CEO, Infinite Kubernetes, Universal Linter, Causality CI/CD, Merge the Multiverse.
  - Add a couple per content update, not all at once.

- [ ] **4. Add random flavor events and seasonal content**
  - Satirical one-offs: "The Elon Tweet," "JS Framework of the Week," "Cloud Bill Shock."
  - Seasonal events: Hacktoberfest, Black Friday discount, Programmer's Day (Day 256), April Fools.
  - Easter eggs: Konami-code bonus, secret building from unusual play pattern.

- [ ] **5. Add narrative systems**
  - Founder background chosen at start or per-prestige (CS Dropout, MBA Graduate, Open Source Veteran, etc.).
  - Story events with dialogue choices (journalist interview, unionization, burnout).
  - Named employee flavor bubbles per building type, toggleable in settings.
  - Multiple endings at final stage based on tracked playstyle stats.

- [ ] **6. Add alternate game modes**
  - Speedrun mode: separate save, timer, leaderboard, no offline progress.
  - Hardcore mode: one life, higher costs, no offline progress, larger AC reward on completion.
  - Sandbox mode: unlimited resources, no prestige.
  - Weekly challenge rotation with modifier presets.

- [ ] **7. Add cosmetics and customization**
  - Office visual themes, building skins, stage-specific soundtrack/sound effects, achievement badges and titles.

- [ ] **8. Add major new systems** (lowest priority — only if the core loop needs a second wind)
  - Rival companies / Competitor AI with market-share stat.
  - Product Launch system: time-gated mini-projects with success/fail risk tied to Technical Debt.
  - R&D Lab: parallel long-duration research slots for permanent bonuses.
  - Brand/Marketing resource: separate currency from LOC, reduces costs/boosts AC, decays if unmaintained.
