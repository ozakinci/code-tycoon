# Code Tycoon - Changelog

Version numbers match the in-game badge. The history was renumbered on 2026-10-29 to the 0.0.x scheme: v1.0.0 became v0.0.1 and v1.1.0 became v0.0.5. Release content is unchanged.

## [v0.0.7] - Trust, Clarity & Safe Saves (2026-11-07)
### Fixed
- **Permanent building loss (BUG-012)**: at high Technical Debt, the game used to delete a random building permanently. Outages are now temporary: one building type stops producing for 30 seconds, recovers automatically, and can be repaired immediately with “Fix now”. Selection is weighted by owned count, only one outage is active at a time, and buildings are never deleted.
- **Shallow save validation (BUG-013)**: nested building/upgrade/perk counts, outages, `lastSaved`, Technical Debt and prestige count are now validated and clamped. Unknown IDs are dropped, equipment is capped by hires, brands by stage, and malformed saves always fall back to a playable state. A save `version` field was added.
- **Background-tab and timer exploit (BUG-014)**: live ticks are capped at 1 second, hidden tabs no longer produce at full rate, and returning to a hidden tab uses the same offline tiers as reopening the game. Short reloads now receive their elapsed time without a modal.
- **Prestige double payout and accidental wipe (BUG-015)**: AC is calculated inside the functional state update, so a double-click cannot award it twice. Selling now opens a confirmation modal listing what resets and what is kept.
- **Unsafe import overwrite (BUG-015)**: importing a save now shows current-vs-imported progress, requires confirmation, and offers “Download Current Save First”.
- **Equipment shown as maxed with zero hires (BUG-016)**: locked equipment now says “Requires a hire” and no longer appears under exhausted technologies.
- **Misleading labels and upgrade text (BUG-017)**: the main stat is “LOC This Run” and Settings shows both “Lifetime LOC” and “LOC This Run”. Building cards distinguish per-unit and total production. Upgrade cards show current and next-level effects. Equipment brand, Stock Options, Code Reviews and Founder Perk descriptions now match their formulas.
- **Contradictory prestige wording (BUG-020)**: the sale confirmation now says the offer is based on LOC earned this run instead of the self-contradictory “lifetime progress this run”.
- **Storage exceptions (BUG-018)**: localStorage reads/writes/removals are wrapped; a failed autosave shows a warning in Settings, and the crash-recovery clear-save action cannot throw.
- **Modal overflow and unlabelled icon buttons (BUG-019)**: modals scroll within 90% of viewport height, use dialog semantics and labels, and icon-only controls have accessible names.

### Added
- Technical Debt net rate, next penalty threshold, progress bar, active outage banner and repair action.
- Team equipment summary with keyboards/coffee/chairs equipped and the current human multiplier.
- Per-unit and total LOC/s on building cards.
- Vitest test suite (19 tests) for save sanitization, encoding, costs, formatting, milestones, prestige, offline tiers and outages.
- Full documentation set under `docs/` (design, technical, research, balance, content, roadmap, playtest, decisions).

### Changed
- Hidden tabs, closed tabs and long foreground stalls now follow the same offline progression rules.
- Technical Debt text now describes temporary outages instead of shutdowns.
- The in-game design document was updated to match the current formulas and recovery behavior.
- `npm run lint` and `npm test` now gate GitHub Pages deployment.
- Updated the test runner to Vitest 5.1 and CI to Node 22; `npm audit` reports zero vulnerabilities.
- TypeScript strict mode, `noFallthroughCasesInSwitch` and `noImplicitOverride` are enabled; React type packages were added.

---

## [v0.0.6] - Technical Debt Fix
### Fixed
- **Technical Debt soft-lock (BUG-010)**: TD could accumulate to thousands while the Refactor cost grew exponentially, leaving the button permanently unaffordable and the -60% penalty permanent. TD is now capped at 200 (the last penalty tier), and Refactor costs 30 seconds of current production (minimum 100 LOC) instead of `100 x 1.1^TD`, so it stays affordable at every stage. Existing saves above 200 TD are clamped on load.
- **Raw floats for large numbers (BUG-011)**: values at or above 1Qa (1e15) rendered as long floats or raw scientific notation. Number formatting now uses suffixes from K up to Vg, then switches to clean scientific notation.

### Changed
- Removed dead leftovers: `.env.local` (unused Gemini key), unused npm dependencies (`autoprefixer`, `@types/node`, duplicate `vite` entry), and the stale `.claude/` settings.
- Rewrote `README.md` to document gameplay, features, stack, scripts, structure and save format.
- Dropped the unimplemented purchase-efficiency / buy-quantity backlog item; the existing 1/10/50/100/next/max buttons are the intended design.

---

## [v0.0.5] - Stage 2 Expansion
### Added
- **HQ Stage System**: Added progression through different headquarters (Mom's Garage -> Co-working Space -> Startup Office -> Corporate Campus).
- **New Buildings**: 
  - College Buddy
  - Fiverr Freelancer
  - Scrum Master
  - Software Architect
- **New Targeted Upgrades**:
  - Version Control (Git)
  - Standing Desks
  - CI/CD Pipeline
  - Gaming Chairs
  - Move to Fabric
  - Microservices
- **Save System**: Added `localStorage` auto-saving (every 5 seconds) and manual save/wipe controls.
- **Offline/Delta-time Progression**: Game loop now calculates LOC based on actual time passed, preventing loss of progress during lag or when switching tabs.

### Changed
- Renamed "Intern" to "College Buddy" and "Junior Developer" to "Fiverr Freelancer" for the Garage stage.
- Upgrades now have specific prerequisite stages before they appear in the shop.
- Buildings now have specific prerequisite stages before they appear in the shop.
- Upgrades now apply targeted multipliers to specific buildings (e.g., Gaming Chairs only boost Juniors and Seniors) instead of just flat click bonuses.

---

## [v0.0.1] - Initial Release
### Added
- Core clicker loop ("Write Code" button).
- Basic buildings (Intern, Junior Developer, Senior Developer, AI Assistant).
- Basic click upgrades (Mechanical Keyboard, Coffee, Energy Drink).
- Real-time LOC/second and LOC/click statistics.
- Dark-themed UI using Tailwind CSS and Lucide React icons.
