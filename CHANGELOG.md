# Code Tycoon - Changelog

## [v0.0.6] - Technical Debt Fix
### Fixed
- **Technical Debt soft-lock (BUG-010)**: TD could accumulate to thousands while the Refactor cost grew exponentially, leaving the button permanently unaffordable and the -60% penalty permanent. TD is now capped at 200 (the last penalty tier), and Refactor costs 30 seconds of current production (minimum 100 LOC) instead of `100 x 1.1^TD`, so it stays affordable at every stage. Existing saves above 200 TD are clamped on load.
- **Raw floats for large numbers (BUG-011)**: values at or above 1T rendered as long floats or raw scientific notation. Number formatting now runs through K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, up to Vg, then switches to clean scientific notation.

### Changed
- Removed dead leftovers: `.env.local` (unused Gemini key), unused npm dependencies (`autoprefixer`, `@types/node`, duplicate `vite` entry), and the stale `.claude/` settings.
- Rewrote `README.md` to document gameplay, features, stack, scripts, structure and save format.
- Dropped the unimplemented purchase-efficiency / buy-quantity backlog item; the existing 1/10/50/100/next/max buttons are the intended design.

---

## [v1.1.0] - Stage 2 Expansion
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

## [v1.0.0] - Initial Release
### Added
- Core clicker loop ("Write Code" button).
- Basic buildings (Intern, Junior Developer, Senior Developer, AI Assistant).
- Basic click upgrades (Mechanical Keyboard, Coffee, Energy Drink).
- Real-time LOC/second and LOC/click statistics.
- Dark-themed UI using Tailwind CSS and Lucide React icons.
