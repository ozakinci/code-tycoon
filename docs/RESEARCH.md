# Code Tycoon — Design Research

**Status:** reference summary  
**Last updated:** 2026-11-07  
**Purpose:** explain the external design ideas behind the v0.0.7 fixes and the proposed roadmap. This is a map, not a verdict; the game’s own playtests outrank it.

---

## 1. What idle/incremental games are

Incremental games are built on a seesaw between production and cost:

- production grows through generators, multipliers and prestige;
- costs usually grow exponentially;
- progress is visible even when the player is not actively clicking;
- a reset converts run progress into a permanent advantage and restarts the climb.

The appeal is not only “numbers go up.” It is visible progress with low pressure, optimization, discovery of new systems, and the power fantasy of a reset. The genre is often criticized as a “glorified spreadsheet” when it lacks meaningful choices, novelty or feedback.

Code Tycoon already has the right skeleton: a short click → hire → upgrade → stage → sell loop, a satirical voice, and a distinctive pressure system (Technical Debt).

## 2. What players tend to like

Synthesized from design writing and public community discussion. This is directional, not a formal survey.

| Hook | Why it works | Code Tycoon implication |
|---|---|---|
| Watching numbers grow | Immediate, readable progress | Keep the big LOC counter and per-second display; add feedback when production changes |
| Automating previous chores | Feels like earned power | Add auto-buy/auto-refactor as late or prestige rewards |
| Prestige layers | Long-term goals and fresh decisions | Make the first prestige more meaningful before adding a second currency |
| Meaningful choices | Agency beats “buy the next thing” | Founder origins, buyer offers, specializations, event choices |
| Discovery / unlock drip | Novelty is a major part of fun | Stage-up reveals, codex, achievements, events |
| Offline progress | Respects real life | Keep it; make caps generous and transparent |
| Optional active play | Rewards attention without forcing it | Positive random spawns; never punish missing them |
| Achievements and milestones | Goals beyond the next purchase; completionism | Data-driven achievements and milestone toasts |
| Theme and humour | Differentiation from generic spreadsheets | Lean into startup satire; it is the strongest asset |
| Clear numbers and bulk buy | Removes busywork | Current buy amounts are good; add automation later |

## 3. What players tend to dislike

| Pain point | Why it hurts | Code Tycoon risk before v0.0.7 |
|---|---|---|
| Being forced to keep the game open | Defeats the idle promise | A hidden tab earned full-rate production while a closed tab was capped |
| Short offline caps | Returning after school/work feels punishing | Baseline was 30 min at 100%; max Remote Work about 9 hours |
| Prestige that feels like a wipe | Reset without a clear payoff feels bad | One-click sale with no confirmation |
| Opaque math | Players cannot explain production drops | TD had no net rate, next threshold or outage cause |
| Punishing random events | Feels unfair, especially for a kid | TD outages permanently deleted buildings |
| Grind walls / content droughts | Only bigger numbers remain | Stage 7 is a large wall; after it, only prestige |
| Too many currencies | Complexity without clarity | Keep two currencies; expand through choices |
| Repeating early purchases | Tedious on every reset | No automation |
| Monetization/dark patterns | Erodes trust | Not present; keep it that way |
| Small text / poor mobile UX | Hard to read or play on a tablet | Dense text; settings modal could overflow |

## 4. Prestige design lessons

Anthony Pecorella’s *The Math of Idle Games* distinguishes prestige currency based on lifetime earnings, maximum earnings, and earnings since reset. The useful design questions are:

- **What does the player keep?** Permanent perks, lifetime stats, unlocks.
- **How much faster is the next run?** A common target is roughly 2×–4× speed-up on the second run, narrowing as meta-layers deepen.
- **When should the player reset?** If payout uses this run, waiting longer is usually better. The UI must make the tradeoff clear.
- **Is resetting a decision or a chore?** A fixed buyer and one button make it a chore.

Code Tycoon uses this-run earnings with a square root and a stage-based buyer multiplier:

`AC = floor(sqrt(totalLoc / 100,000)) × buyerMultiplier`

This is a reasonable “push deeper before selling” curve. The weakness is that the buyer is fixed by stage, so the only decision is timing. A buyer-choice layer would add depth without changing the formula.

## 5. Retention psychology (used gently)

- **Achievements** work because they anchor expectations, increase self-efficacy, guide players and provide feedback. They are most effective when progress is visible and goals are specific.
- **Variable rewards** create anticipation, but should be optional and non-punitive. Cookie Clicker’s golden cookies are a proven example: they appear on a timer, grant a temporary or instant boost, and missing one costs nothing.
- **Avoid dark patterns:** no energy timers, ads, paywalls, FOMO streaks, or loss aversion aimed at a child. For a personal/family game, trust and fun matter more than retention metrics.
- **Respect the return:** a welcome-back report should explain what happened and never shame the player for being away.

## 6. Technical-debt and failure design

Technical Debt works best as a *thematic pressure*, not a random punishment:

- the player should see it coming (net rate, thresholds, warnings);
- the consequence should be recoverable (temporary outage, repair action);
- the cure should be understandable and affordable (refactor cost tied to production);
- the system should create decisions (push through, refactor now, buy DevOps) rather than erase progress.

This is why v0.0.7 replaced permanent building deletion with a 30-second outage. The design keeps the consequence visible without making the player lose something they cannot recover.

## 7. Offline and hidden-tab behavior

Players consistently dislike being punished for closing the game. Two rules follow:

1. A hidden tab and a closed tab should use the same progression rules.
2. Offline caps should be transparent, and the return report should explain the tier applied.

v0.0.7 implements rule 1. Rule 2 is implemented through the welcome-back report. Whether the baseline caps are generous enough for a school day plus sleep remains an open design question.

## 8. Sources and caveats

Primary sources consulted:

- Anthony Pecorella, *The Math of Idle Games, Parts I–III* (Game Developer / Kongregate, 2016–2017). Covers generator costs, alternate growth models, prestige formulas and reset behavior.
- Machinations.io, *How to design idle games*. Easy core loop, sophisticated economy, visible achievement counter; the meta loop must give the core loop a reason to continue.
- Game Developer, *Lessons of my first incremental game*. Discovery, content scalability and meaningful gameplay matter more than raw numbers.
- Wikipedia, *Incremental game*. Definitions of clicker vs idle, prestige, rapid escalation and the “glorified spreadsheet” critique.
- Public community discussion on r/incremental_games and Steam forums, summarized from search results and thread titles.

Caveats:

- Reddit blocked direct page fetches during the review; community pain points were synthesized from search snippets, thread titles, Steam discussions and public articles, not a formal survey.
- Player preferences vary by subgenre. Code Tycoon is a light management/clicker hybrid; this research prioritizes clarity, humour and respect for time over deep RPG systems.
- The strongest evidence is the game’s own playtest with the owner’s kid and friends. Use [PLAYTEST.md](PLAYTEST.md), not this document, to settle disputes about fun.

## 9. What this research changed in v0.0.7

| Finding | Change |
|---|---|
| Random permanent loss feels unfair | TD outages are temporary, visible and repairable |
| Opaque penalties destroy trust | TD net rate, next threshold, progress bar and outage banner added |
| Background tabs bypass offline rules | Hidden tabs use the offline tier function |
| Prestige can be an accidental wipe | Confirmation modal lists resets/keeps; payout computed safely |
| Players cannot explain production | Building per-unit/total output, equipment summary, current/next upgrade text |
| Mobile modals can trap content | Settings and reports scroll inside `max-h-[90vh]` |
| Unlabelled icons hurt accessibility | `aria-label`/`title` on icon-only controls |

## 10. What remains a design choice, not a research conclusion

- exact offline generosity for a family game;
- whether clicking should become a real alternate playstyle;
- whether to add achievements before story choices;
- how much automation is healthy before it removes the game;
- whether to expand vertically after Stage 7 at all.
