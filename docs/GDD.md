# Code Tycoon — Game Design Document

**Status:** living design reference  
**Last updated:** 2026-11-07  
**Game version:** v0.0.7  
**Source of truth:** `src/App.tsx` for values, formulas and content IDs. This document explains intent; it is not a second implementation.

Companion documents: [TECH.md](TECH.md) · [BALANCE.md](BALANCE.md) · [CONTENT_BIBLE.md](CONTENT_BIBLE.md) · [ROADMAP.md](ROADMAP.md) · [PLAYTEST.md](PLAYTEST.md) · [DECISIONS.md](DECISIONS.md)

---

## 1. Vision

Code Tycoon is a browser idle/clicker game about turning a garage side project into a galactic software empire. The player writes Lines of Code (LOC), hires a team, buys increasingly absurd technology, grows the HQ through eight stages, manages Technical Debt, and eventually sells the company for Acquisition Capital (AC) and permanent Founder Perks.

The tone is affectionate startup satire: the jokes target tech culture, process theatre, vendor churn, and founder archetypes — not the player, and not real individuals.

The game is built for personal play first: the owner, their kid, and close friends. It should be easy to start, readable without a wiki, respectful of time away, and fun to return to.

## 2. Audience and constraints

| Item | Decision |
|---|---|
| Primary audience | Owner, kid, close friends |
| Broader release | Only if the personal version is genuinely worth sharing |
| Platform | Desktop browser first; tablet/mobile should remain usable |
| Backend | None. Saves live in the browser and in exported files |
| Monetization | None. No ads, energy timers, purchases, analytics, or dark patterns |
| Session shape | Short active check-ins plus longer idle stretches |
| Content scale | 8 stages, 12 buildings, 22 upgrades, 6 Founder Perks |

## 3. Design pillars

1. **Visible progress.** Every purchase should visibly change production, speed, or possibility. The player should be able to answer “why did my number change?”
2. **Satire with warmth.** The joke is the industry, never the player. Humour should still land for a younger player.
3. **Respect for time.** Offline progress and recoverable penalties matter more than retention tricks. Missing a random event should never cost progress.
4. **Optional active play.** Clicking and events should reward attention without making an idle player feel punished.
5. **Choices over inflation.** New depth should come from identity, story, buyer decisions and events — not from Stage 8–12 and another row of bigger numbers.
6. **If it ain’t broke, don’t rewrite it.** The core loop, two-currency model and visual identity are stable foundations.

## 4. Core loop

1. Click **Write Code** to earn LOC.
2. Spend LOC on buildings that produce LOC per second.
3. Spend LOC on upgrades that improve production, click power, or equipment.
4. Buy the next HQ stage to unlock better hires, upgrades and buyers.
5. At Stage 2+, sell the company for AC.
6. Spend AC on permanent Founder Perks.
7. Start again stronger, with the same company name and a longer lifetime record.

The loop is intentionally short. The long-term game comes from pushing deeper before a sale, choosing when to reset, and experimenting with different company identities once scenario content exists.

## 5. Progression map

| Stage | HQ | Cost (LOC) | Buyer | Buyer multiplier | Main unlocks |
|---:|---|---:|---|---:|---|
| 0 | Mom's Garage | 0 | — | — | College Buddy, Fiverr Freelancer, Junior Developer, Scrum Master, basic upgrades |
| 1 | Co-working Space | 1,500,000 | — | — | Senior Developer, DevOps Engineer, Software Architect, chairs, equipment brands, CI/CD, Agile, Fabric |
| 2 | Startup Office | 50,000,000 | Rival Startup | ×1 | Code Reviewer, Microservices Team, AI Code Generator, Stock Options, Kubernetes, Neural Networks, first sale |
| 3 | Corporate Campus | 5,000,000,000 | Venture Capital Firm | ×3 | Cloud Server Farm, Data Lake |
| 4 | Tech Skyscraper | 1,000,000,000,000 | Social Media Giant | ×10 | Quantum Computer, Metaverse |
| 5 | Global Megacorp | 500,000,000,000,000 | Tech Conglomerate | ×50 | Tech Monopoly |
| 6 | Cloud Empire | 250,000,000,000,000,000 | Search Engine Monopolist | ×250 | Dyson Sphere |
| 7 | Orbital Station | 100,000,000,000,000,000,000 | Global AI Overlord | ×1000 | Time-Traveling Compilers, maximum buyer multiplier |

### Current content inventory

| Category | Count | Notes |
|---|---:|---|
| HQ stages | 8 | Garage to orbital station |
| Buildings | 12 | 9 human-hire buildings plus AI, cloud and quantum hardware |
| Upgrades | 22 | 3 equipment counts, 3 equipment brands, 2 repeatables, 14 one-time tech upgrades |
| Founder Perks | 6 | Permanent AC upgrades |
| Currencies | 2 | LOC (run), AC (prestige) |
| Core systems | 5 | Clicking, buildings, upgrades, HQ stages, prestige |
| Distinctive system | 1 | Technical Debt with penalty tiers and temporary outages |
| Persistence | 1 | Versioned localStorage save, file export/import, hard reset |

## 6. Systems

### 6.1 Clicking

- The base click grants 1 LOC plus 1% of current LOC/second.
- StackOverflow Premium multiplies click power by 5; AI Autocomplete by 10; 10x Culture by `2 ^ level`.
- Founder’s Network adds +10 base click power per level.
- Click power also receives the global production multiplier, including the Technical Debt penalty.

Clicking is a supplement, not a requirement. It should feel useful in the first minutes and remain a flavour action later; the game must stay viable while idle.

### 6.2 Buildings and milestones

Buildings are the main production engine. Each owned unit adds its base production, multiplied by:

- milestone multipliers at 10, 25, 50, 100, 250 and 500 owned (×2 each, up to ×64);
- Code Reviews (additive +10% per level to the building multiplier);
- the team equipment multiplier for buildings with `hiresCount > 0`;
- targeted upgrades such as Agile, Microservices Architecture and Neural Networks;
- the global multiplier and Technical Debt penalty.

Building costs grow exponentially. Buying in bulk costs the sum of each level’s price, not `count × current price`.

### 6.3 Equipment and hires

- Human buildings contribute to a shared hire count. Microservices Team contributes 10 hires per unit; AI, Cloud Server Farm and Quantum Computer contribute none.
- Mechanical Keyboard, Coffee Machine and Ergonomic Chair are capped by total hires.
- Equipment provides its bonus fractionally: `equipped / totalHires` of the team receives it. The team multiplier is the average across hires.
- Equipment brands increase the per-item bonus. The upgrade card shows the current effect and the next level’s effect.
- The Upgrades tab shows a team-equipment summary with equipped counts, total hires and the resulting human multiplier.

### 6.4 Upgrades

- Equipment counts are repeatable up to the current hire count.
- Equipment brands have a stage-scaled maximum (up to 4).
- Code Reviews is an unlimited additive building multiplier.
- Stock Options is a 5-level compounding global multiplier (`1.5 ^ level`).
- One-time technology upgrades apply global or building-specific effects.
- Upgrade cards show **Current** and **Next level** effects where they differ.
- If equipment has no eligible hires, it shows “Requires a hire” instead of “Maxed”.

### 6.5 HQ stages

HQ stages are the main gate for content. Each stage costs LOC, unlocks new buildings/upgrades, and changes the buyer multiplier available when selling. Stage 7 is the final HQ stage in the current content scale.

Technical Debt at 200 blocks further HQ upgrades. The block is intentional and visible; it is removed by refactoring.

### 6.6 Technical Debt and temporary outages

Technical Debt (TD) is the game’s second pressure axis. It grows with company size, reduces production at fixed thresholds, and can temporarily take one building type offline.

- TD is capped at 200.
- Accrual is `(buildings × 0.01 + min(20, upgrade levels) × 0.05)` TD/min, multiplied by the TD acquisition multiplier.
- Thresholds: 10 = −5%, 25 = −10%, 50 = −20%, 100 = −40%, 200 = −60% and HQ progression blocked.
- At 50+ TD, an outage can start: one building type stops producing for 30 seconds. The chance is about 0.5% per second at 50–99 TD and 2% per second at 100+ TD.
- Outage selection is weighted by owned count, so a single rare building is less likely to be chosen than a common one.
- Only one outage is active at a time. It recovers automatically, or the player can press **Fix now**.
- An outage never deletes a building. This is a hard design rule.
- Refactor costs 30 seconds of current production (minimum 100 LOC) and removes 10 TD.
- DevOps Engineers reduce TD continuously; Code Reviewers, Senior Developers and Software Architects reduce accrual.

### 6.7 Offline progress and hidden tabs

Offline production uses three tiers:

| Time away | Rate |
|---|---|
| First 30 minutes | 100% |
| Up to 120 minutes | 50% |
| Up to 240 minutes | 20% |
| Beyond 240 minutes | 0% |

Remote Work Policy adds 30 minutes to every threshold per level. The welcome-back report explains the tier applied.

A hidden browser tab is treated as offline time and uses the same rules. A background timer cannot award full-rate production just because the browser throttled it. Long foreground stalls, such as a laptop sleeping with the tab visible, also use the offline tiers. Reloads shorter than one minute receive their elapsed time without a modal.

### 6.8 Prestige

- Available from Stage 2.
- Payout: `floor(sqrt(totalLoc this run / 100,000)) × buyerMultiplier`.
- The player must confirm the sale in a modal that lists what resets and what is kept.
- Resets: LOC, buildings, upgrades, HQ stage, Technical Debt and outages.
- Keeps: Founder Perks, AC, lifetime LOC, acquisition count.
- Angel Investor grants starting LOC after a reset.
- The payout is calculated inside the state update, so a double-click cannot award AC twice.

### 6.9 Saves and recovery

- Autosave every 5 seconds to localStorage.
- Manual export to a text file; import with a preview of current vs imported progress and a confirmation step.
- Import confirmation offers “Download Current Save First”.
- Every loaded/imported save is validated and clamped. Unknown IDs and malformed nested counts are dropped.
- If localStorage is unavailable, the game keeps running and Settings shows a warning to export manually.
- A crash boundary offers reload and “clear save” recovery.

## 7. UX principles

- Big, readable LOC counter; monospace numbers; dark zinc/emerald identity.
- Affordability is shown by colour and by disabled state; controls remain keyboard-reachable.
- Icon-only buttons have accessible labels.
- Modals fit within 90% of viewport height and scroll internally.
- The TD panel shows the current penalty, net TD/min, next threshold, progress bar, and any active outage.
- Building cards show per-unit output and total output for owned units.
- Settings distinguishes **Lifetime LOC** from **LOC This Run**.
- Numbers use compact suffixes through Vg, then scientific notation.

## 8. Visual and audio direction

- Dark zinc background, emerald accents for LOC/positive actions, amber for warnings, red for debt/outages.
- Lucide icons provide the current visual language.
- Stage identity is conveyed by name, icon and description; a richer visual HQ is a later polish item.
- Audio is not currently implemented and remains optional.

## 9. Non-goals for the current version

- No backend, accounts, cloud saves, analytics, leaderboards or multiplayer.
- No monetization, ads, energy timers, loot boxes or FOMO mechanics.
- No framework or state-library rewrite.
- No Stage 8–12 inflation unless a future decision explicitly justifies it.
- No second prestige currency until the first prestige loop is exhausted.
- No full illustration pipeline before the core game is polished.
- No content added only to raise a count.

## 10. Open design questions

These require the owner’s decision and are intentionally not answered by code:

1. **Audience priority:** is the next iteration optimized primarily for the kid, for friends, or for the owner?
2. **Target run length:** should a satisfying run take an evening, a weekend, or longer?
3. **Devices:** is tablet/mobile a first-class target or a nice-to-have?
4. **Scenario direction:** which sideways expansion appeals most — founder origins, stage story beats, buyer choice, event deck, or specializations?
5. **Refactor comfort:** is a behaviour-preserving module split acceptable, or should `App.tsx` stay monolithic for now?

Until answered, the working defaults are: kid-friendly clarity, temporary outages, safer saves, confirmations for destructive actions, mobile-safe modals, strict TypeScript and focused tests.

## 11. Documentation maintenance

- Change a formula or value → update [BALANCE.md](BALANCE.md) and the changelog.
- Add content → update this document, [CONTENT_BIBLE.md](CONTENT_BIBLE.md), and the data validation test once it exists.
- Make an architectural decision → add an entry to [DECISIONS.md](DECISIONS.md).
- Run a playtest → record observations in [PLAYTEST.md](PLAYTEST.md).
- Keep the in-game design doc player-facing and short; this file is the full reference.
