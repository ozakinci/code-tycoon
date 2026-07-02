# Code Tycoon - Changelog

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
