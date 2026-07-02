export const designDocument = `Code Tycoon - Detailed Game Design & Technical Document

1. OVERVIEW
-----------
Code Tycoon is an incremental (clicker/idle) game where the player starts as a solo developer in a garage and grows a startup into a multi-planetary tech empire. The primary currency is "Lines of Code" (LOC). The game satirizes the tech industry, startup culture, and software engineering tropes.

2. TECHNICAL STACK
------------------
- Framework: React 18+ with Vite
- Language: TypeScript
- Styling: Tailwind CSS
- Icons: Lucide-React
- Architecture: Client-Side Single Page Application (SPA).
- State Management: React useState / useEffect for game loop (10 ticks per second).
- Persistence: LocalStorage for saving game state (Base64 encoded for export/import).

3. CORE GAMEPLAY LOOP
---------------------
1. Click to generate Lines of Code (LOC).
2. Spend LOC to hire developers (Buildings) which generate LOC automatically per second.
3. Spend LOC on Upgrades to multiply production (both manual clicking and automated generation).
4. Upgrade the Headquarters (Stages) to unlock better upgrades and buyout multipliers.
5. Reach Stage 2 or higher to "Sell Company" (Prestige). This resets LOC, Buildings, and Upgrades, but grants "Acquisition Capital" (AC).
6. Spend AC on Founder Perks (Prestige Upgrades) which are permanent bonuses that persist across all future startups.
7. Repeat the process to scale infinitely.

4. MECHANICS & FORMULAS
-----------------------
- Building Cost Formula: BaseCost * (GrowthFactor ^ OwnedCount)
- Total LOC Per Second: Sum of (BuildingCount * BaseProduction) multiplied by relevant Upgrade multipliers and Founder Perks.
- Click Power: Base click power (boosted by specific upgrades and perks) + 1% of Total LOC Per Second.
- Acquisition Capital (AC) Calculation: Base AC = floor( (Total Lifetime LOC / 100,000) ^ 0.5 ). Total AC gained = Base AC * BuyerMultiplier (based on current Stage).

5. HQ STAGES
------------
Stages dictate game progression, unlock new upgrades, and determine the prestige multiplier when selling the company.
Stage 0: Mom's Garage (Cost: 0, Buyer: N/A, Multiplier: N/A)
Stage 1: Co-working Space (Cost: 1,500,000 LOC, Buyer: N/A, Multiplier: N/A)
Stage 2: Startup Office (Cost: 50,000,000 LOC, Buyer: Rival Startup, Multiplier: x1)
Stage 3: Corporate Campus (Cost: 5,000,000,000 LOC, Buyer: Venture Capital Firm, Multiplier: x3)
Stage 4: Tech Skyscraper (Cost: 1,000,000,000,000 LOC, Buyer: Social Media Giant, Multiplier: x10)
Stage 5: Global Megacorp (Cost: 500,000,000,000,000 LOC, Buyer: Tech Conglomerate, Multiplier: x50)
Stage 6: Cloud Empire (Cost: 250,000,000,000,000,000 LOC, Buyer: Search Engine Monopolist, Multiplier: x250)
Stage 7: Orbital Station (Cost: 100,000,000,000,000,000,000 LOC, Buyer: Global AI Overlord, Multiplier: x1000)

6. BUILDINGS (HIRES)
--------------------
Each building produces a base amount of LOC per second and increases the total "Hires" count, which interacts with Equipment Upgrades.
1. College Buddy: Base Cost 15, Base Prod 1, Growth 1.07 (Hires: 1)
2. Fiverr Freelancer: Base Cost 150, Base Prod 5, Growth 1.08 (Hires: 1)
3. Junior Developer: Base Cost 1,000, Base Prod 25, Growth 1.09 (Hires: 1)
4. Scrum Master: Base Cost 5,000, Base Prod 100, Growth 1.10 (Hires: 1)
5. Senior Developer: Base Cost 25,000, Base Prod 450, Growth 1.11 (Hires: 1)
6. DevOps Engineer: Base Cost 75,000, Base Prod 1,000, Growth 1.09 (Hires: 1)
7. Software Architect: Base Cost 150,000, Base Prod 2,500, Growth 1.12 (Hires: 1)
8. Code Reviewer: Base Cost 500,000, Base Prod 5,000, Growth 1.10 (Hires: 1)
9. Microservices Team: Base Cost 1,000,000, Base Prod 15,000, Growth 1.13 (Hires: 10)
10. AI Code Generator: Base Cost 5,000,000, Base Prod 65,000, Growth 1.14 (Hires: 0)
11. Cloud Server Farm: Base Cost 50,000,000, Base Prod 500,000, Growth 1.15 (Hires: 0)
12. Quantum Computer: Base Cost 1,000,000,000, Base Prod 8,000,000, Growth 1.16 (Hires: 0)

7. UPGRADES
-----------
Regular upgrades cost LOC and reset upon prestige.

A. Equipment Counts (Max level = Total Hires):
- Mechanical Keyboard: Cost 150 (x1.2 growth). +50% base production per equipped hire.
- Coffee Machine: Cost 500 (x1.3 growth). +100% base production per equipped hire.
- Ergonomic Chair: Cost 50,000 (x1.4 growth). +200% base production per equipped hire. Requires Stage 1.

B. Equipment Brands (Increases the bonus of Equipment Counts):
- Keyboard Brands (Max Lvl scales with Stage): Cost 50,000 (x10 growth). Each level adds +50% to keyboard bonus. Requires Stage 1.
- Coffee Brands (Max Lvl scales with Stage): Cost 150,000 (x10 growth). Each level adds +100% to coffee bonus. Requires Stage 1.
- Chair Brands (Max Lvl scales with Stage): Cost 2,500,000 (x10 growth). Each level adds +200% to chair bonus. Requires Stage 2.

C. Other Repeatables:
- Code Reviews: Cost 2,500 (x2.0 growth). +10% base production to all buildings per level.
- Stock Options (Max Lvl 5): Cost 25,000,000 (x10 growth). Global production x1.5 per level. Requires Stage 2.

D. One-Time Tech Upgrades (Max Lvl 1):
- StackOverflow Premium: Cost 500. Clicking is 5x effective.
- Version Control (Git): Cost 1,000. Global production x1.5.
- AI Autocomplete: Cost 7,500. Clicking is 10x effective.
- CI/CD Pipeline: Cost 1,000,000. Global production x2. Requires Stage 1.
- Agile Methodology: Cost 2,500,000. Scrum Masters production x3. Requires Stage 1.
- Move to Fabric: Cost 5,000,000. Global production x2. Requires Stage 1.
- Microservices Architecture: Cost 50,000,000. Architect & Senior production x2. Requires Stage 2.
- Kubernetes Cluster: Cost 100,000,000. Global production x2. Requires Stage 2.
- Neural Networks: Cost 250,000,000. AI Code Generator production x3. Requires Stage 2.
- Data Lake: Cost 5,000,000,000. Global production x2. Requires Stage 3.
- Pivot to Metaverse: Cost 100,000,000,000. Global production x2. Requires Stage 4.
- Tech Monopoly: Cost 50,000,000,000,000. Global production x3. Requires Stage 5.
- Code-Powered Dyson Sphere: Cost 10,000,000,000,000,000. Global production x5. Requires Stage 6.
- Time-Traveling Compilers: Cost 1,000,000,000,000,000,000. Global production x10. Requires Stage 7.

8. FOUNDER PERKS (PRESTIGE UPGRADES)
------------------------------------
Purchased with Acquisition Capital (AC) in the Boardroom. Permanent bonuses.
- Founder's Network: Base Cost 1 (x1.5 growth). Base Click Power +10 per level.
- Angel Investor: Base Cost 2 (x2.0 growth). Start runs with 50,000 LOC per level.
- Remote Work Policy: Base Cost 3 (x1.7 growth, Max Lvl 10). Adds +30 minutes to all offline progress cap thresholds per level.
- Brand Recognition: Base Cost 5 (x1.8 growth, Max Lvl 20). Reduces all building costs by 2% per level.
- Corporate Synergy: Base Cost 10 (x3.0 growth). Global Production +20% per level.
- 10x Culture: Base Cost 25 (x5.0 growth). Clicking is x2 as effective per level (exponential).

9. TECHNICAL DEBT
-----------------
- Technical Debt (TD) accumulates passively over time based on your infrastructure size.
- Passive Generation: +0.01 TD/min per building owned, and +0.05 TD/min per upgrade owned (includes repeatable levels, capped at 20 upgrades for a max of +1.0 TD/min).
- Production penalty thresholds: 10 TD = -5% production; 25 TD = -10%; 50 TD = -20% + small chance of a random building "shutdown"; 100 TD = -40% + higher shutdown chance; 200 TD = -60%, block further HQ stage progression until reduced.
- Refactor button: cost = 100 * 1.1^(current TD), removes 10 TD per use.
- DevOps Engineer: -0.1 TD/min per DevOps Engineer owned, capping at 20 owned (-2 TD/min max).
- Code Reviewer: -2% TD accumulation per Code Reviewer owned, capping at 25 owned (25 x 2% = 50%).
- Senior Developer and Software Architect: -2% TD generation rate each, flat (applies once if at least one is owned). Owning both gives -4% total.
`;
