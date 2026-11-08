# Code Tycoon — Playtest Guide

**Status:** ready for first v0.0.8 session  
**Last updated:** 2026-11-08

Companion documents: [GDD.md](GDD.md) · [ROADMAP.md](ROADMAP.md) · [BALANCE.md](BALANCE.md)

---

## 1. Purpose

Playtests exist to answer three questions:

1. Can a new player start without help?
2. Does the game feel fair when it takes something away?
3. Is there a moment that makes the player want to keep going?

This is a personal/family game. No analytics, no recording, no hidden telemetry. Notes are written down by hand with the tester’s knowledge.

## 2. Who to test with

| Group | What they are best at finding |
|---|---|
| Owner | Balance, pacing, bugs, long-term loop |
| Kid (age-appropriate) | Clarity, delight, frustration, readability |
| Close friend | First-time onboarding, humour, “would I return?” |
| Tablet/mobile user | Touch targets, modal overflow, small text |

Use a separate browser profile or a copied save so a test never endangers the main progress. Never overwrite the owner’s save without exporting it first.

## 3. Before the session

- [ ] Run `npm run lint`, `npm test` and `npm run build`.
- [ ] Open the production build or dev server.
- [ ] Export the current save as a backup.
- [ ] Prepare a fresh profile for first-run testing.
- [ ] Prepare an imported mid-game save for prestige/outage testing.
- [ ] Keep a notebook or a blank copy of the feedback table below.
- [ ] Explain that there are no wrong answers and the game is allowed to be criticised.

## 4. First-run script (20–30 minutes)

Ask the tester to play normally. Give help only when they are stuck for more than a minute, and write down what confused them before helping.

1. **Start:** open the game on a fresh save. Note the time to the first click and the first hire.
2. **Bulk buy:** buy 10 College Buddies. Check whether the cost and production readouts make sense.
3. **Upgrades:** open the Upgrades tab. Ask what “Requires a hire” means. Buy a keyboard once a hire exists.
4. **Technical Debt:** watch the TD panel. Ask what the net rate and next threshold mean. Use Refactor and confirm TD drops by 10.
5. **Outage:** play until TD reaches 50. Wait for an outage. Check:
   - the banner names the building;
   - that building’s card shows 0 LOC/s;
   - the owned count does not change;
   - “Fix now” restores production.
6. **Away:** hide the tab for about two minutes, then return. Check the welcome-back report and that production is consistent.
7. **Reload:** reload the page. Check that the save, stage, LOC This Run and Lifetime LOC survive.
8. **Prestige:** on a progressed save, open the Boardroom. Open the confirmation, cancel once, then confirm. Check that the modal’s “resets/keeps” list matches what happens.
9. **Import:** export the save, import the file, and confirm the preview shows current vs imported progress. Cancel once; then confirm.
10. **Settings:** open Settings on a short viewport. Scroll to the bottom; check that Save Data and Danger Zone are reachable.
11. **Keyboard/accessibility:** tab through the top bar and Settings. Check that icon-only buttons have readable labels.

## 5. Observation checklist

Record behaviour, not just opinions.

### Clarity

- [ ] Did the player understand what to buy next?
- [ ] Did they notice the TD penalty before it became severe?
- [ ] Did they understand why production changed?
- [ ] Did they read “LOC This Run” as different from “Lifetime LOC”?
- [ ] Did they understand that an outage is temporary?

### Fairness

- [ ] Did any random event feel like a punishment?
- [ ] Did an outage ever delete a building? (It must not.)
- [ ] Did the player feel safe reloading or closing the tab?
- [ ] Did the prestige confirmation prevent an accidental wipe?
- [ ] Did the import preview make the overwrite understandable?

### Delight

- [ ] Did any joke or name make them laugh?
- [ ] Was there a moment of “oh, I can buy that now”?
- [ ] Did a milestone or stage-up feel like an event?
- [ ] Did they ask to keep playing?

### Friction

- [ ] Any text too small or too dense?
- [ ] Any button hard to tap on a tablet?
- [ ] Any modal cut off or impossible to scroll?
- [ ] Any moment where the player waited without a goal?

## 6. Feedback log

Copy this table for each session.

| Field | Entry |
|---|---|
| Date | |
| Version | v0.0.8 |
| Tester | |
| Device / browser | |
| Session length | |
| Previous idle-game experience | |
| Time to first hire | |
| Time to first upgrade | |
| Time to first outage | |
| Time to first sale (if reached) | |
| What they loved | |
| What confused them | |
| What frustrated them | |
| Moment they wanted to stop | |
| Moment they wanted to continue | |
| Bugs found (with ticket ID if logged) | |
| Quotes worth keeping | |
| One change to try next | |

**Current log:** no human playtest sessions recorded yet. A scripted browser smoke test was run on 2026-11-08 (see section 11); it covers mechanics, persistence, responsive layout and accessibility names, but cannot judge fun, confusion or delight. The first human session should focus on the new outage flow, the prestige/import confirmations, the compact top console, and tablet readability.

## 7. Bug triage rubric

| Severity | Definition | Action |
|---|---|---|
| Critical | Progress loss, crash, unrecoverable state, NaN/Infinity economy | Fix before any content work |
| High | Blocks the core loop, wrong numbers, destructive action without confirmation | Fix in the next patch |
| Medium | Confusing text, inaccessible modal, misleading feedback | Fix in the next release |
| Low | Cosmetic issue, rare edge case, nice-to-have | Log and batch |
| Idea | A new feature or content request | Move to [BACKLOG.md](../BACKLOG.md), not a bug ticket |

## 8. Asking better questions

Avoid leading questions such as “Did you like the outage?” Ask:

- “What were you trying to do just now?”
- “What did you think that number meant?”
- “What would you have done next if I had not said anything?”
- “Was there a moment you felt stuck? What did you think was wrong?”
- “What would you tell a friend this game is about?”

Let silence do some work. A player who is thinking is not necessarily confused.

## 9. Safety and privacy

- Do not publish a child’s name or identifying details in any public issue.
- Do not record audio/video without explicit consent.
- Do not add analytics or third-party scripts to a playtest build.
- If a save is shared for debugging, remove personal names first.
- Keep the exported save files local; they are plaintext-under-obfuscation, not encrypted.

## 10. After the session

1. Log the observations while they are fresh.
2. Separate **observed behaviour** from **interpretation**.
3. File bugs with reproduction steps and a ticket ID.
4. Move feature ideas to the backlog, not into the release.
5. Choose at most one or two changes for the next iteration.
6. Update [BALANCE.md](BALANCE.md) if the session produced balance evidence.
7. Add a short note to [DECISIONS.md](DECISIONS.md) if the session settled a design question.

## 11. Scripted browser smoke test — 2026-11-08

**Type:** Playwright walkthrough in headless Microsoft Edge against the Vite dev server. This is a smoke test, not a substitute for a human playtest: it verifies mechanics, state transitions, persistence, responsive layout and accessible names, but cannot judge fun, confusion, humour or the desire to keep playing.

**Result:** 29 of 29 checks passed, with no JavaScript console errors or page errors. The only HTTP noise was the browser's automatic `/favicon.ico` request returning 404, because the project has no favicon.

### Covered

- Fresh save, clicking, first hire, autosave and reload.
- Zero-hire equipment shows “Requires a hire”, not “Maxed”.
- Settings at 360×640: 90% viewport limit, internal scrolling, Danger Zone reachable and labelled controls.
- Technical Debt at 60 with an active College Buddy outage: banner and countdown, zero production, all 50 buildings retained, **Fix now**, and Refactor removing 10 TD.
- Stage 2 prestige: payout, reset/keep summary, cancel, confirm, AC award, acquisition-count increment and run reset.
- Offline load after 90 minutes: 5.76M LOC with the 50% tier explanation.
- Simulated hidden interval of 90 seconds: 144.00K LOC, 100% tier, production resumes.
- Import: current-vs-imported preview, cancel, “Download Current Save First” and confirmed replacement.
- Upgrades: equipment summary, current/next descriptions, keyboard purchase update, ×10 bulk purchase and per-unit/total building output.

### Limitations

- Hidden-tab time was simulated by overriding `document.hidden` and shifting `Date.now` for the visibility event; the browser was never actually backgrounded.
- Outages were seeded through a crafted save rather than waiting for the 0.5%/s random roll. Auto-expiry and **Fix now** were exercised; the random trigger was not observed live.
- Only Microsoft Edge/Chromium was tested. Firefox and Safari remain untested.
- Screenshots were inspected at desktop size and 360×640. No screen reader or real touch device was used.

### Fixed since this smoke test

- Per-click and per-second values below 1,000 no longer display as **0** (v0.0.8, BUG-021). Rates below 10 show up to two decimals; larger values use whole numbers and compact suffixes.
- The prestige confirmation previously said “lifetime progress this run”. This contradiction was found during the walkthrough and fixed as BUG-020.

### Observations not fixed

- At 360px wide, the buy-amount row wraps **MAX** onto a second line with a large empty gap. Usable, but visually awkward.
- No favicon is defined, so browsers request `/favicon.ico` and log a 404. Cosmetic; it belongs with the planned PWA/icon work.

### v0.0.8 layout check

The compact top console was verified in headless Edge on 2026-11-08 at 1366×768 and 360×640: the Write Code tile is centered, the Technical Debt info and Refactor cells sit side by side on desktop, TD 60 with an active outage shows the banner and **Fix now** without breaking the row, no horizontal overflow appears at 360px, and the tab bar plus first building row are visible above the fold on desktop. This is a layout smoke check, not a human playtest; the first human session should still judge clarity and touch comfort.
