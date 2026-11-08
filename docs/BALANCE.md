# Code Tycoon — Balance Reference

**Status:** current values, observations and tuning notes  
**Last updated:** 2026-11-07  
**Version:** v0.0.7  
**Source of truth:** formulas and constants in `src/App.tsx`. This document explains intent and consequences.

Companion documents: [GDD.md](GDD.md) · [TECH.md](TECH.md) · [RESEARCH.md](RESEARCH.md) · [PLAYTEST.md](PLAYTEST.md)

---

## 1. Balance goals

- The first hire should happen within the first minute.
- The first HQ upgrade should feel achievable in a short session.
- A first sale should be reachable without a guide, but deep runs should pay more.
- Technical Debt should create a visible decision, never an unrecoverable state.
- Idle and active play should both be viable; neither should be mandatory.
- No cost, multiplier or state value may become NaN, negative or Infinity during normal play.
- The player should always be able to explain a production change.

The target run length is not settled. It is one of the open questions in [GDD.md](GDD.md).

## 2. Currencies

| Currency | Scope | Sources | Uses |
|---|---|---|---|
| LOC | This run | Clicking, buildings, offline progress | Buildings, upgrades, HQ stages, refactors |
| AC | Permanent | Selling the company | Founder Perks |

There are exactly two currencies. Do not add a third without an explicit decision.

## 3. Cost formulas

### Buildings and upgrades

For a purchase of `n` levels starting at `owned`:

```
cost(n) = baseCost × growthFactor^owned × (growthFactor^n − 1) / (growthFactor − 1)
```

For `growthFactor = 1`, cost is `baseCost × n`.

- Costs are floored.
- Bulk purchases sum the individual level prices.
- `getSafePow` clamps the exponent per growth factor so the result stays finite.
- Building costs receive the Brand Recognition discount: `baseCost × (1 − 0.02 × brandLevel)`.
- `next` buys up to the next owned-count milestone: 10, 25, 50, 100, 250, 500, 1000, 2500, 5000.
- `max` buys as many as current LOC/AC allows, capped by max level.

### Refactor

```
refactorCost = max(100, calculateProduction(state) × 30)
```

Refactor removes 10 TD. Because the cost is tied to production, it stays affordable at every stage.

## 4. Production formula

```
LOC/s = Σ [
  owned × baseProduction
  × milestoneMultiplier(owned)
  × buildingMultiplier
  × humanMultiplier (if hiresCount > 0)
  × globalMultiplier
  × outageMultiplier
]
```

- `outageMultiplier` is 0 for a building type with an active outage, otherwise 1.
- `milestoneMultiplier` is ×2 at 10, 25, 50, 100, 250 and 500 owned; maximum ×64.
- Code Reviews adds `0.10 × level` to the building multiplier after milestones.
- Targeted upgrades: Agile ×3 Scrum Masters; Microservices Architecture ×2 Architects and Seniors; Neural Networks ×3 AI Code Generators.
- `globalMultiplier` includes all purchased global tech, Stock Options, Corporate Synergy and the TD penalty.

### Human/equipment multiplier

```
humanMultiplier = 1
  + (keyboards / hires) × (keyboardBrand + 1) × 0.50
  + (coffee / hires)    × (coffeeBrand + 1) × 1.00
  + (chairs / hires)    × (chairBrand + 1) × 2.00
```

- Equipment counts are capped by total hires.
- Bonuses are averaged across the team: equipping half the team with a +50% item gives +25%.
- Microservices Team contributes 10 hires per unit. AI, Cloud Server Farm and Quantum Computer contribute none.

### Click power

```
clickPower = (
  (1 + 10 × founderNetworkLevel)
  × (5 if StackOverflow)
  × (10 if AI Autocomplete)
  × 2^10xCultureLevel
  × globalMultiplier
) + 0.01 × LOC/s
```

Clicking therefore scales with the same global and TD multipliers as production, plus 1% of current production.

## 5. Technical Debt

### Accrual

```
baseTDPerMin = buildings × 0.01 + min(20, totalUpgradeLevels) × 0.05
accrualPerMin = baseTDPerMin × acquisitionMultiplier
netPerMin = accrualPerMin − devopsReductionPerMin
```

- `acquisitionMultiplier = 1 − min(0.90, reviewerReduction + seniorFlat + architectFlat)`.
- Reviewers: 2% each, capped at 25 reviewers (50%).
- Senior Developer and Software Architect: 2% each, flat once each.
- DevOps Engineers: 0.1 TD/min each, capped at 20 (2 TD/min).
- TD is clamped to `0..200` every tick.

### Penalty tiers

| TD | Production | HQ | Outage risk |
|---:|---:|---|---|
| 0–9 | 100% | Open | None |
| 10–24 | 95% | Open | None |
| 25–49 | 90% | Open | None |
| 50–99 | 80% | Open | 0.5%/s, 30 s, one at a time |
| 100–199 | 60% | Open | 2%/s, 30 s, one at a time |
| 200 | 40% | Blocked | 2%/s, 30 s, one at a time |

Outages pick a building type with probability proportional to owned count. They never delete units. The player can wait 30 seconds or press **Fix now**.

### TD observations

- The curve is inverted: a modest early company accumulates TD quickly, while a late company with 20 DevOps, 25 Reviewers, a Senior and an Architect can reduce net TD to near zero. This makes TD annoying early and ignorable late.
- Options (not yet changed): scale accrual with production/stage, cap total reduction lower, make low TD improve AC or unlock premium buyers, or add bulk/auto-refactor as a QoL unlock.
- The temporary-outage change removes the permanent-loss failure mode but does not fix the curve.

## 6. HQ and prestige

### Buyer payouts

```
baseAC = floor(sqrt(totalLocThisRun / 100,000))
payout = baseAC × buyerMultiplier
```

| Stage | Buyer multiplier | Notes |
|---:|---:|---|
| 2 | ×1 | First sale |
| 3 | ×3 | |
| 4 | ×10 | |
| 5 | ×50 | |
| 6 | ×250 | |
| 7 | ×1000 | |

The buyer is fixed by stage. The only current prestige decision is timing.

### Founder Perks

| Perk | Base cost | Growth | Max | Current effect |
|---|---:|---:|---:|---|
| Founder’s Network | 1 | 1.5 | — | +10 base click power per level |
| Angel Investor | 2 | 2.0 | — | Start runs with 50,000 × level LOC |
| Remote Work Policy | 3 | 1.7 | 10 | +30 min to every offline threshold per level |
| Brand Recognition | 5 | 1.8 | 20 | −2% building cost per level |
| Corporate Synergy | 10 | 3.0 | — | +0.20 to the global multiplier per level (additive) |
| 10x Culture | 25 | 5.0 | — | ×2 click power per level (exponential) |

### Prestige observations

- **Corporate Synergy** is additive inside an already-large global multiplier. It reads as “+20% production” but is nearly invisible late. Options: make it a dedicated multiplicative bucket, re-cost it, or keep the honest additive description. Current text says additive.
- **Founder’s Network** falls off once 1% of production dominates click power. It needs a secondary effect if clicking should stay relevant.
- **10x Culture** doubles click power per level. At high levels, active clicking can dwarf idle production. For a family-friendly idle game, consider a cap or a softer curve.
- **Angel Investor** and **Remote Work** are quality-of-life perks; **Brand Recognition** is strong; the two click perks are the outliers.
- AC jumps by buyer multiplier can make an early Stage 2 sale feel like a mistake. A minimum first-sale payout or a “recommended” hint is a possible fix.

## 7. Offline progress

| Window | Rate |
|---|---|
| First 30 min | 100% |
| 30–120 min | 50% |
| 120–240 min | 20% |
| Beyond 240 min | 0% |

Remote Work adds 30 minutes to each threshold (max +300 minutes at level 10).

Observations:

- The baseline is 4 hours of partial progress; a school day plus sleep can exceed the maximum 9-hour window.
- A more generous “family mode” or an 8-hour full-rate window is a design choice, not an obvious bug.
- Hidden tabs now use the same tiers as closed tabs. This is consistent, but players who previously left a tab open will see less progress.

## 8. Pacing observations

A directional greedy simulation during the 2026-11 review suggested:

- the first several HQ stages can be reached in hours by an optimal active player;
- Stage 6 is roughly a couple of days of optimized play;
- Stage 7 is a much larger wall;
- a casual or younger player will be slower, especially without automation.

These are hypotheses from an approximate model, not a committed simulator. The shape is broadly reasonable: fast early game, mid-game wall, long endgame. The concern is that Stage 7 feels like a number wall rather than a narrative climax.

The next balance step is a committed simulator that can report time-to-stage, production, TD and prestige payout for a greedy player. Until then, tune with playtests and one change at a time.

## 9. Known outliers and open balance questions

| Item | Observation | Status |
|---|---|---|
| TD curve | Annoying early, ignorable late | Open; options above |
| Corporate Synergy | Additive, weak late | Open; description corrected only |
| Founder’s Network | Falls off late | Open |
| 10x Culture | Exponential click power can dominate | Open |
| Code Reviews | Additive after milestones, weaker than it sounds | Description corrected; cost unchanged |
| Offline caps | 4–9 hours may be short for family life | Open; user decision |
| AC jumps | Early sale can feel like a mistake | Open; first-sale guarantee proposed |
| Equipment clarity | Fractional team bonus was invisible | Summary added; math unchanged |
| Non-human buildings | AI/Cloud/Quantum get no equipment path | Open; hardware/tooling path proposed |
| Stage 7 payoff | Large wall, no climax | Open; endings/story proposed |

## 10. Tuning knobs

| Area | Knob | Current |
|---|---|---|
| Buildings | `baseCost`, `baseProduction`, `growthFactor` | Per building table |
| Milestones | Thresholds and multiplier | 10/25/50/100/250/500, ×2 each |
| Global tech | Multipliers | ×1.5 to ×10 |
| Stock Options | Per-level multiplier and max | ×1.5 per level, max 5 (×7.59 total) |
| TD | Accrual coefficients, caps, thresholds | 0.01/building, 0.05/upgrade, cap 200 |
| TD reduction | DevOps rate, reviewer %, flat roles | 0.1/min, 2%, 2% each |
| Outages | Chance, duration, weighting | 0.5%/s or 2%/s, 30 s, weighted |
| Refactor | Cost seconds, TD removed | 30 s production, 10 TD |
| Offline | Tier windows and rates | 30/120/240 min, 100/50/20% |
| Prestige | AC divisor/exponent, buyer multipliers | 100,000; sqrt; ×1 to ×1000 |
| Perks | Costs, growth, effects | See table |

## 11. Balance change log

| Version | Change | Reason |
|---|---|---|
| v0.0.7 | Permanent building deletion replaced by 30-second temporary outages | Random permanent loss was the most player-hostile behavior in the game |
| v0.0.7 | Hidden tabs use offline tiers; live tick capped at 1 s | Background tabs bypassed the offline design |
| v0.0.7 | No cost, AC or perk-effect value changes; the only production change is the temporary outage penalty replacing permanent deletion | Keep the economy stable while fixing trust and clarity |
| v0.0.7 | Upgrade, perk and equipment descriptions corrected to current-level semantics | Text did not match the formulas |
| v0.0.6 | TD capped at 200; Refactor costs 30 s of production | Removed the exponential-cost soft-lock |
| v0.0.6 | Number suffixes extended through Vg | Large values rendered as raw floats |

## 12. Change protocol

1. Write down the hypothesis and the expected player-visible effect.
2. Change one knob at a time.
3. Run `npm test`, `npm run lint` and `npm run build`.
4. Simulate or playtest the affected stage range.
5. Update this document, the changelog and the in-game design doc if the player-facing explanation changed.
6. Revert if the change makes the game less readable, less fair or less fun — even if the numbers look better.
