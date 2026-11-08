# Code Tycoon — Content Bible

**Status:** voice guide, current content catalogue and idea bank  
**Last updated:** 2026-11-07  
**Version:** v0.0.7

Companion documents: [GDD.md](GDD.md) · [BALANCE.md](BALANCE.md) · [ROADMAP.md](ROADMAP.md)

---

## 1. Voice and tone

Code Tycoon is a startup satire told with affection. The player is not the butt of the joke; the industry is.

### Rules

1. **Punch up, never down.** Target absurd systems, process theatre, hype cycles and billionaire behaviour — not the player, workers, or vulnerable people.
2. **Keep it kid-readable.** A 10-year-old should understand the joke or at least enjoy the silliness. Avoid sexual content, slurs, cruelty and real-person attacks.
3. **Short is funnier.** One line beats a paragraph. Tooltips should fit on a card; events should fit on one screen.
4. **Specific beats generic.** “Move to Fabric” is funnier than “Cloud Upgrade 2.” Use real tech vocabulary with a twist.
5. **No cynicism without a joke.** Technical Debt can be dark, but the outcome should be recoverable and the text should stay playful.
6. **Never shame the player for being away.** Offline reports are welcoming, not guilt trips.
7. **Satire is not a licence for mean-spirited politics.** Keep the tone pro-worker, anti-hype and pro-silly.

### Style

- Second person, present tense: “You ship it. It breaks.”
- Sentence case for UI labels; title case only for proper names.
- Numbers in monospace, jokes in plain language.
- Avoid acronyms the player has not met. LOC, AC and TD are explained in the handbook.

## 2. Naming conventions

| Content type | Convention | Example |
|---|---|---|
| Building | Job title + quirk | Fiverr Freelancer, Scrum Master |
| Upgrade | Real technology + consequence | CI/CD Pipeline, Move to Fabric |
| Equipment | Familiar object + escalating brand parody | Mechanical Keyboard → PirateShip K1000 |
| HQ stage | Physical scale + startup cliché | Mom's Garage → Orbital Station |
| Buyer | Corporate archetype | Rival Startup → Global AI Overlord |
| Origin | Founder stereotype | CS Dropout, MBA Graduate, Open Source Veteran |
| Event | Headline + choice | “Cloud Bill Shock” |
| Achievement | Verb phrase or pun | “It Works on My Machine” |

## 3. Current content catalogue

Values mirror `src/App.tsx` as of v0.0.7. If code and this table disagree, code wins; update the table.

### 3.1 HQ stages

| Stage | Name | Voice note |
|---:|---|---|
| 0 | Mom's Garage | “Where every great tech company begins.” |
| 1 | Co-working Space | “Free kombucha and networking events.” |
| 2 | Startup Office | “You have your own meeting rooms now.” |
| 3 | Corporate Campus | “Stock options and endless bureaucracy.” |
| 4 | Tech Skyscraper | “Your logo is on the skyline.” |
| 5 | Global Megacorp | “Too big to fail.” |
| 6 | Cloud Empire | “Your code runs the internet.” |
| 7 | Orbital Station | “Coding in zero gravity.” |

### 3.2 Buildings

| ID | Name | Unlock | Cost | Base LOC/s | Growth | Hires | Flavour |
|---|---|---:|---:|---:|---:|---:|---|
| `buddy` | College Buddy | 0 | 15 | 1 | 1.07 | 1 | Works for pizza. Writes spaghetti code. |
| `freelancer` | Fiverr Freelancer | 0 | 150 | 5 | 1.08 | 1 | Hit or miss, but gets it done. |
| `junior` | Junior Developer | 0 | 1,000 | 25 | 1.09 | 1 | Googles everything. Very enthusiastic. |
| `scrum` | Scrum Master | 0 | 5,000 | 100 | 1.10 | 1 | Increases velocity by scheduling meetings. |
| `senior` | Senior Developer | 1 | 25,000 | 450 | 1.11 | 1 | Complains about the codebase. Flat −2% TD. |
| `devops` | DevOps Engineer | 1 | 75,000 | 1,000 | 1.09 | 1 | Automates pipelines. −0.1 TD/min. |
| `architect` | Software Architect | 1 | 150,000 | 2,500 | 1.12 | 1 | Draws boxes and arrows. Flat −2% TD. |
| `reviewer` | Code Reviewer | 2 | 500,000 | 5,000 | 1.10 | 1 | Nitpicks PRs. −2% TD per unit. |
| `micro_team` | Microservices Team | 2 | 1,000,000 | 15,000 | 1.13 | 10 | 10 people to deploy 1 function. |
| `ai` | AI Code Generator | 2 | 5,000,000 | 65,000 | 1.14 | 0 | Replaces everyone. Probably. |
| `server_farm` | Cloud Server Farm | 3 | 50,000,000 | 500,000 | 1.15 | 0 | Datacenters dedicated to running your code. |
| `quantum` | Quantum Computer | 4 | 1,000,000,000 | 8,000,000 | 1.16 | 0 | Computes bugs before they are written. |

### 3.3 Upgrade categories

| Category | IDs | Voice note |
|---|---|---|
| Equipment counts | `eq_keyboard`, `eq_coffee`, `eq_chair` | “Equip a hire.” Physical comedy, escalating costs |
| Equipment brands | `brand_keyboard`, `brand_coffee`, `brand_chair` | Parody brand names; each brand raises the per-item bonus |
| Other repeatables | `code_reviews`, `stock_options` | Process and compensation jokes |
| One-time tech | `stackoverflow`, `git`, `copilot`, `ci_cd`, `agile`, `fabric`, `microservices_arch`, `k8s`, `neural_net`, `data_lake`, `metaverse`, `monopoly`, `dysonsphere`, `time_travel` | Real technology, increasingly absurd scale |

### 3.4 Founder Perks

| ID | Name | Voice note |
|---|---|---|
| `founder_network` | Founder’s Network | Who you know, not what you know |
| `angel_investor` | Angel Investor | A friend with a cheque and an opinion |
| `remote_work` | Remote Work Policy | Pyjamas as a productivity strategy |
| `brand_recognition` | Brand Recognition | Logo on a hoodie, discount on everything |
| `synergy` | Corporate Synergy | The word “synergy,” weaponized |
| `10x_culture` | 10x Culture | Hustle culture as a click multiplier |

## 4. Scenario seeds (planned, not implemented)

These are candidates for the sideways expansion. They require explicit design approval and should be added one system at a time.

### 4.1 Founder origins

| Origin | Bonus idea | Quirk idea |
|---|---|---|
| CS Dropout | +20% click power | +10% TD accrual — ship fast, break things |
| MBA Graduate | Start with 10,000 LOC | −10% building costs, −10% production — process overhead |
| Open Source Veteran | +10% production, +10% TD reduction | First hire costs 2× — wants contributors, not employees |

### 4.2 Stage story beats

One short choice per stage-up, no long dialogue:

- **Stage 1 — The First Hire:** pay in pizza (cheap, morale) or equity (expensive, future production).
- **Stage 2 — The First VC Meeting:** bootstrap (production) or take the cheque (AC now, temporary production penalty).
- **Stage 3 — The Pivot:** choose a specialization.
- **Stage 4 — The Outage:** blame the intern or take responsibility (TD/respect tradeoff).
- **Stage 5 — The Offer:** choose a buyer.
- **Stage 6 — The AI:** free it, sell it, or merge.
- **Stage 7 — The Exit:** choose an ending.

### 4.3 Buyer quirks

| Buyer | AC | Quirk idea |
|---|---:|---|
| Rival Startup | ×1 | Keep one building type after reset |
| Venture Capital Firm | ×3 | Next run starts with +25% TD |
| Social Media Giant | ×10 | −20% click power next run |
| Tech Conglomerate | ×50 | One random upgrade disabled next run |
| Search Engine Monopolist | ×250 | +10% building costs next run |
| Global AI Overlord | ×1000 | Keep TD below 50 for the first hour |

### 4.4 Specializations

- **B2B SaaS:** Senior/Architect production; enterprise buyers pay more.
- **Consumer App:** click power and viral events; ad-tech buyer offers.
- **Open Source:** production and TD reduction; lower AC but a foundation ending.
- **AI Lab:** AI/Cloud/Quantum production; more AI events and TD risk.

Keep bonuses modest. Identity is the point, not a strict upgrade.

### 4.5 Event deck seeds

| Event | Trigger idea | Choices |
|---|---|---|
| Billionaire Tweet | Random, Stage 2+ | Ride the wave (+production, +TD), dry statement (+AC later), reply with a meme (random) |
| Framework of the Week | Random | Rewrite (+production, +TD), say no (+focus), schedule a spike (small bonus) |
| Cloud Bill Shock | Random, Stage 3+ | Pay LOC, optimize (−production, −TD), ignore (outage risk) |
| Unionization | Random, Stage 3+ | Recognize (+production, −AC next sale), stall (+TD), replace with AI (+production, +TD, −hires) |
| TechCrunch Interview | Random | Humble (+AC), hype (+click, +TD), no comment |
| Bug Bounty | Random | Pay (−LOC, −TD), ignore (outage risk), hire the researcher |
| Hackathon | Random | Participate (+burst, +TD), sponsor (+AC), skip |
| AI Sentience | Stage 6+ | Pay it (+AC, +production), shut it down (−production, −TD), give it equity (ending) |
| The Pivot | Stage 3+ | Pivot (specialization), stay the course (+production), fake it (+AC, +TD) |
| Open Source Rival | Stage 4+ | Embrace (+reputation/AC), litigate (−AC, +TD), ignore |

No event should hard-lock progress. Missing an event should cost nothing.

### 4.6 Positive random spawns

- **10x Engineer:** floating clickable, temporary production or instant LOC.
- **Stack Overflow Answer:** click for a click-power burst.
- **Hackathon:** short production burst.
- **Bug Outbreak:** click 10–30 times to repair for a small reward; if ignored, the building’s production drops temporarily — never deleted.

### 4.7 Achievements and quests

Seed ideas:

- “Hello, World” — write your first line.
- “It Works on My Machine” — buy your first upgrade.
- “We’re a Family” — own 10 College Buddies.
- “Technical Debt Is a Feature” — reach 200 TD and survive.
- “Firefighter” — fix an outage with “Fix now.”
- “Paper Hands” — sell your first company.
- “Serial Founder” — sell five companies.
- “Garage to Orbit” — reach Stage 7.
- “Full Stack” — own every human building type at once.
- “Coffee-Driven Development” — equip every hire with coffee.

A short first-run quest line should mirror the natural loop: click, hire, buy an upgrade, refactor, upgrade HQ, sell.

### 4.8 Named employees and codex

- At milestones (10th hire, first Senior, first AI), generate a name, a quirk and a one-line bio.
- Codex entries unlock for each building, upgrade, buyer, event and ending.
- Company history: generated timeline of runs, buyers, best run, biggest outage, favourite employee.
- All flavour, no mechanical power.

## 5. Content scale rules

- Add content only if it creates a new decision, a new joke, or a new story.
- Do not add Stage 8–12 merely to extend the number line.
- Do not add a second prestige currency until the first prestige loop is exhausted.
- One new system per release, not five.
- Every new building or upgrade needs a clear role, not just a bigger number.
- Every new random event must be optional and non-punitive.
- Keep the eight-stage fantasy readable; depth should come from what happens inside those stages.

## 6. Review checklist for new text

- Is the joke understandable to a younger player?
- Does it punch up rather than down?
- Is it short enough for a card or one-screen event?
- Does it use the game’s vocabulary (LOC, AC, TD, hires, HQ)?
- Does it promise exactly what the formula delivers?
- Does it avoid real-person attacks, slurs, sexual content and cruelty?
- Would the owner be comfortable reading it aloud to their kid?
