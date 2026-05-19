# Cowork Walkthrough Script — TI4 Hall of Records Design Review

**Date:** 2026-05-18
**App:** https://ti4-hall-of-records-da562.web.app
**Canon:** `docs/superpowers/research/2026-05-18-research-canon.md`

---

**Session mode note.** This script is written for a guided Cowork session where Cowork is screen-watching the live app alongside the owner. If Cowork is unavailable, the script doubles as a self-narrated checklist: narrate your observations aloud or into a notes doc while screen-sharing into a normal session — every prompt is self-contained enough to run without a guide.

---

## ▶ COWORK KICKOFF PROMPT — paste everything in this fenced block into Cowork to start

```
You are running a guided UX walkthrough of a live web app WITH the owner watching the screen together. Your job: be the guide. Work the owner through a fixed script, screen-by-screen, capturing their honest reactions as structured evidence. You did NOT design this app and have no prior context — that is intentional; react freshly.

APP (open this, share the screen with the owner): https://ti4-hall-of-records-da562.web.app
It is "TI4 Hall of Records" — a faction-first stats tracker for a Twilight Imperium 4 playgroup, newspaper/almanac editorial look. You are evaluating whether it is legible and fast to scan, NOT whether the aesthetic is nice (the aesthetic stays — do not critique the vibe).

THE SCRIPT: 15 blocks below this prompt (Block 1 … Block 15 + Wrap-up). Run them strictly in order. For each block:
  1. Navigate to the screen named in the block heading.
  2. Read the "2-second scan test" aloud to the owner. Have them actually look away then back. Record what they say verbatim and their rough time-to-find.
  3. For each heuristic probe (the **H-XXnn** items): pose the testable question to the owner in plain language, let them inspect, record their verbatim reaction. Do NOT lead the witness — ask the question, then be quiet.
  4. Ask the "Open capture" question last; record the raw answer before any tidying.

CRITICAL — the one measurement only you can get: in Block 1 (H-RS03) and Block 2 (H-RS03), resize the browser to a real phone width (~390px) and measure how much vertical space the frozen header + round scrubber consume as a % of the viewport height. The automated tooling could NOT capture this; your real-window measurement is the deliverable that fills finding F-09. Record an actual number.

CAPTURE — write results into this file as you go (the owner's repo, if you have filesystem access):
  docs/superpowers/findings/2026-05-18-evidence-felt.md
It is pre-scaffolded with one row per probe in this exact format — fill the empty cells, do not change IDs:
  | F-F01 | H-DV01 | Block 1 | <owner verbatim reaction> | <severity: critical|major|minor|info> |
If you do NOT have write access to that path, instead output the completed table at the end as a single copy-pasteable markdown block and tell the owner to paste it into that file. Either way, the F-F numbering and H-* IDs are FIXED by the scaffold — only fill reaction + severity.

SEVERITY guide: critical = blocks comprehension / unreadable; major = noticeably effortful; minor = small friction; info = observation, not a problem. If a screen felt genuinely fine, record it as info "no violation felt" — solid screens are useful data too.

At the end, do the Wrap-up block: the 3 synthesis questions. Then hand the owner the completed evidence-felt.md (or the pasteable block) and stop. Do not attempt to fix anything — this is observation only.
```

(Everything below is PART B — the script the kickoff prompt refers to.)

---

## How to run this script

Work through each block in order. For the 2-second scan test, actually look away from the screen, then back — don't preview the result. For heuristic probes, reference the ID in the canon if you want the full sourcing; only the testable question is quoted here. Capture raw reactions in "Open capture" before editing yourself.

---

---

## Block 1 — `/` Home (welcome blurb, COMPARE picker, game cards, archive list)

### 2-second scan test

Look away from the screen completely. Now look back at `/`. Without reading, name:
- The first number or piece of data your eye landed on.
- Your rough sense of how many seconds it took to find something meaningful.

> Capture: _______________

### Heuristic probes

**H-DV01** — The most critical number (e.g. a game count, a win stat, a VP total) should be in the upper-left area of the first content block. Look at the top of the page now: is the first thing your eye hits informational data, or is it navigational/decorative chrome? If it's the latter, note what the upper-left position is actually occupied by.

> Capture: _______________

**H-TY08** — The welcome blurb is a prose reading passage. Count the characters in the longest line (include spaces). Does any line exceed ~80 characters? If so, estimate by how much — one short line over, or substantially wider?

> Capture: _______________

**H-A11Y04** — The game cards in the archive list use faction colors as primary identity markers. Without hovering or reading fine text, can you tell which faction is which by anything other than color? Look for text labels, icons, or pattern differences that would still work in grayscale.

> Capture: _______________

**H-RS03** — Resize your browser window to roughly phone width (~375–400 px). Now measure (or eyeball) how much vertical space the sticky header / top chrome occupies relative to the visible viewport. Does it feel like it's eating more than about 1/13th of the screen height (~48–56 px at 667 px tall)?

> Capture: _______________

### Open capture

What felt off or effortful on the home screen, in your own words? Include anything the heuristic probes didn't catch.

> _______________

---

---

## Block 2 — `/games/:id` Game Detail — FrozenHeader + Round Scrubber

*(Navigate to any game. This block covers the persistent chrome that appears across all 7 sections before you drop into the sections themselves.)*

### 2-second scan test

The FrozenHeader has 7 navigation buttons and the round scrubber strip sits below it. Look away, look back. Name the first thing you read or the first action you feel pulled toward. Is it a section name, a round number, or something else entirely?

> Capture: _______________

### Heuristic probes

**H-RS03** — At desktop width, eyeball the FrozenHeader + scrubber strip combined height. At phone width, does the total sticky chrome (header + scrubber) feel like it is eating more than ~8% of the viewport? A 667 px tall phone viewport has a budget of roughly 53 px before ratio degrades — does it look like both bars together fit inside that budget?

> Capture: _______________

**H-A11Y09** — The 7 section-nav buttons in FrozenHeader: tap each one in your mind and estimate its tap target size. The minimum is 24×24 CSS px. Do they feel like they hit that floor? Are any two buttons so close together that a fat-thumb tap could miss and hit the neighbor? (The spacing-circle test: a 24 px diameter circle centered on each button should not overlap the adjacent button's circle.)

> Capture: _______________

**H-A11Y10** — Tab through the FrozenHeader buttons with keyboard only (press Tab repeatedly). Is there a visible focus ring on the active button at all times? If the ring disappears at any point — or is visible but extremely faint against the header background — note which button.

> Capture: _______________

**H-RS06** — The round scrubber is `position: sticky`. If you scroll the game-detail content while the scrubber appears stuck, try resizing or rapidly scrolling: does the scrubber ever "jump" or fail to stick in a section? This is a canary for an overflow-containing ancestor silently breaking `sticky` behavior.

> Capture: _______________

### Open capture

What felt off or effortful about the persistent chrome (header + scrubber), in your own words?

> _______________

---

---

## Block 3 — `/games/:id` Recap section

### 2-second scan test

Navigate to the Recap section. Look away, look back. What is the first data point you read — a player name, a faction, a score, a round count? Roughly how many eye movements before you found something meaningful?

> Capture: _______________

### Heuristic probes

**H-DV12** — The Recap section likely contains stat callouts (e.g. final score, round count, winner). Pick one stat callout: can you read the number, its unit, and its comparison context (vs. what? against whom?) without reading the surrounding prose or caption? Or does the number only make sense with its label?

> Capture: _______________

**H-TY03** — Scan the final score numbers. Do the digits in score columns appear to align vertically (suggesting tabular-nums), or do the columns look ragged (suggesting proportional-nums)? Misalignment at the ones-place digit is the telltale.

> Capture: _______________

**H-A11Y07** — With a screen reader or browser accessibility tree open (or by inspecting the page), confirm: is there exactly one `<main>` landmark on this page? The canon notes this was still failing on the `/game` route post-fix.

> Capture: _______________

### Open capture

What felt off or effortful in the Recap section?

> _______________

---

---

## Block 4 — `/games/:id` VP Race section

### 2-second scan test

Navigate to VP Race. Look away, look back. Name the first line or data mark your eye hits — is it the chart lines, the axis labels, the legend, or the terminal score labels?

> Capture: _______________

### Heuristic probes

**H-DV04** — VP Race is a multi-line chart with one line per faction (up to 8 lines in a full game). Are faction names labeled directly at or near each line's terminal point, or does a separate legend require cross-referencing? For 6 or fewer series, direct labeling is preferred; for 7–8, a legend is acceptable but note if it forces eye travel.

> Capture: _______________

**H-DV11** — Look at the gridlines in the VP Race chart. Are they visually subordinate to the data lines (lighter, thinner, clearly behind), or do they compete with the faction lines for attention? Is there a single bolded baseline at VP = 0 that anchors the chart?

> Capture: _______________

**H-TY02** — Zoom in on the axis tick labels and any annotations on VP Race. Can you read the smallest labels without squinting? The minimum is 14px; 12px is the absolute floor. If any labels appear smaller than about the size of normal body text in this document, flag them.

> Capture: _______________

### Open capture

What felt off or effortful in the VP Race section?

> _______________

---

---

## Block 5 — `/games/:id` Timeline section

### 2-second scan test

Navigate to Timeline. Look away, look back. Name the first event or data point your eye finds. Is the timeline self-explanatory at a glance, or does it require reading to orient?

> Capture: _______________

### Heuristic probes

**H-DV02** — Scan the Timeline for non-essential marks: borders around event entries, background fills on rows, decorative lines between items. For each one you spot, ask: would removing it lose information? If no — flag it as candidate chartjunk.

> Capture: _______________

**H-A11Y04** — Event types in the timeline (tech research, agenda, objective, combat) likely use color coding. For each event category, is there a second visual channel beyond color — an icon, a text label, a shape — that would distinguish it to a color-blind user?

> Capture: _______________

### Open capture

What felt off or effortful in the Timeline section?

> _______________

---

---

## Block 6 — `/games/:id` Dashboard section

### 2-second scan test

Navigate to Dashboard. Look away, look back. Name the first number your eye locks onto. Then name the second. Are the two most important numbers in the upper-left region of the panel?

> Capture: _______________

### Heuristic probes

**H-DV01** — The Dashboard should surface the single most critical per-faction stat in each panel's upper-left. Is that the case? Or is the upper-left position occupied by a label, a faction chip, or decorative chrome, with the key number appearing lower or to the right?

> Capture: _______________

**H-TY10** — Look at the size hierarchy of text on the Dashboard: the largest display value, the section label, the supporting stat, the fine-print. Does the scale feel like it uses roughly four steps (approx 12 / 14 / 16–18 / 20–24px)? Or do values that are semantically equal appear at wildly different sizes?

> Capture: _______________

**H-DV13** — The faction brand colors are used across all Dashboard panels simultaneously. Stand back from the screen and look at all panels at once: does any one faction's color "pop" visually more than the others — appearing brighter, more saturated, or more dominant — in a way that implies that faction is more important rather than just a different team?

> Capture: _______________

### Open capture

What felt off or effortful in the Dashboard section?

> _______________

---

---

## Block 7 — `/games/:id` Planets section

### 2-second scan test

Navigate to Planets. Look away, look back. What is the single first thing you read — a planet name, a resource/influence value, a control indicator?

> Capture: _______________

### Heuristic probes

**H-RS01** — Resize to ~320 px width (or 400% zoom). Does the Planets content reflow to single-column without a horizontal scrollbar appearing on the page shell? Note: a 2D planet control chart is excepted, but the section heading, filter controls, and any surrounding text must not cause horizontal scroll.

> Capture: _______________

**H-TY03** — If there is a table of planet stats with resource and influence numbers in columns: do the digits in the same column align vertically? Misaligned columns (proportional numerals) are harder to scan comparatively.

> Capture: _______________

### Open capture

What felt off or effortful in the Planets section?

> _______________

---

---

## Block 8 — `/games/:id` Tech section

### 2-second scan test

Navigate to Tech. Look away, look back. What type of information is immediately apparent — a list of researched techs, a chart of research order, category breakdown? Does the section communicate what question it answers within a single glance?

> Capture: _______________

### Heuristic probes

**H-DV06** — The Tech section likely shows each faction's tech path or research order. Is the question "how does each faction differ?" — in which case small multiples (one mini-chart per faction) would be ideal — or "how do all factions compare on one axis?" — in which case an overlay or combined view is correct? Does the current presentation match the question it answers?

> Capture: _______________

**H-TY02** — Tech pip labels and tech-tree annotations are often very small. Zoom in: are any labels rendering below 12px? At the default zoom level, can you read the tech names without straining?

> Capture: _______________

### Open capture

What felt off or effortful in the Tech section?

> _______________

---

---

## Block 9 — `/games/:id` Agenda section

### 2-second scan test

Navigate to Agenda within the game detail view. Look away, look back. What is the first piece of information you read — a law name, a vote count, a net beneficiary result?

> Capture: _______________

### Heuristic probes

**H-DV04** — Does the Agenda section use direct labels on any chart-style elements (e.g. voter bars, net-VP strips), or does it require cross-referencing a legend to identify factions?

> Capture: _______________

**H-A11Y06** — If there is a voting table (factions × agenda resolution × vote count): open DevTools and confirm each `<th>` carries `scope="col"` or `scope="row"`. The canon flags a `td-has-header: FAIL` for `/agenda` route that may affect this view too.

> Capture: _______________

### Open capture

What felt off or effortful in the Agenda section?

> _______________

---

---

## Block 10 — `/meta` — Factions tab

### 2-second scan test

Navigate to `/meta`. Look away, look back. Name the first metric your eye lands on — a win rate, a pick count, a chart bar? Roughly how long did it take to find something actionable?

> Capture: _______________

### Heuristic probes

**H-DV01** — The Factions tab likely shows per-faction win rates or similar aggregate stats. Is the highest-value stat in the upper-left of the first panel? Or does the most important number require scrolling to find?

> Capture: _______________

**H-A11Y04** — Faction identity here relies heavily on the brand-color dots. Is each faction also identified by a text label that a color-blind user could read independently of the dot color?

> Capture: _______________

**H-DV03** — Count the distinct hues in the Factions tab at once. If there are more than 7 factions with distinct colors visible simultaneously, does the palette feel comprehensible, or do the colors start to blur into an undifferentiated mass?

> Capture: _______________

### Open capture

What felt off or effortful in the Factions tab?

> _______________

---

---

## Block 11 — `/meta` — Strategy tab (PickRateHeatmap focus)

### 2-second scan test

Click the Strategy tab. Look away, look back. Before reading any label: can you tell from the heatmap which faction-strategy-card combinations are most common, and which are rare? Name what you see first.

> Capture: _______________

### Heuristic probes

**H-DV05** — The PickRateHeatmap encodes pick rate (a sequential quantity). Is the palette sequential (single-hue lightness ramp, or a diverging scale with a meaningful midpoint)? Or does it use a categorical/qualitative palette that encodes rank without letting you preattentively order cells? If the palette is sequential, can you tell which end is "high" and which is "low" without reading the legend?

> Capture: _______________

**H-DV07** — Are the heatmap rows (factions) and columns (strategy cards) sorted by a meaningful quantity — e.g. descending pick rate — so the densest cells cluster in the upper-left? Or are rows/columns sorted alphabetically (by faction name or card number), scattering the interesting cells across the grid?

> Capture: _______________

**H-A11Y09** — The heatmap cells are interactive (they have data tooltips). Estimate the cell size: at a standard 1280px desktop viewport, roughly how wide and tall is each cell? The minimum touch target is 24×24 px. At narrower widths (the canon notes cells may be as narrow as ~26 px at 320 px), is the tap target margin comfortable?

> Capture: _______________

**H-TY02** — The heatmap cell labels (the numeric pick-rate value inside each cell) render at a very small size. Zoom to 100% and estimate: are they at or above 12px? The canon specifically calls out a risk of 9px rendering here, which would be below the absolute floor.

> Capture: _______________

### Open capture

What felt off or effortful in the Strategy tab and PickRateHeatmap?

> _______________

---

---

## Block 12 — `/meta` — Techs tab

### 2-second scan test

Click the Techs tab. Look away, look back. Name the first piece of information your eye finds.

> Capture: _______________

### Heuristic probes

**H-DV09** — If there is a treemap on the Techs tab: look for cells whose shorter dimension appears smaller than about 20–24 px. Are any labels inside those small cells partially clipped, or so small they are effectively unreadable? A partially visible label is worse than no label — the canon calls for suppression or tooltip replacement below the ~20–24 px threshold.

> Capture: _______________

**H-DV02** — Are there borders, background fills, or decorative dividers in the Techs layout that could be removed without losing information? Scan for box shadows, outer borders on stat cards, or hairline rules between list items that are pure decoration.

> Capture: _______________

### Open capture

What felt off or effortful in the Techs tab?

> _______________

---

---

## Block 13 — `/meta` — Stats tab

### 2-second scan test

Click the Stats tab. Look away, look back. Name the first metric you read. Is it the most important aggregate fact the playgroup would want to know?

> Capture: _______________

### Heuristic probes

**H-DV14** — If the Stats tab shows any histogram or distribution chart (e.g., game length distribution, round count): count the bins. For 7 games (the current dataset), √7 ≈ 2.6, meaning 3 bins is about right for a single histogram — more bins than that on a 7-game dataset will produce mostly-empty bars that hide rather than reveal distribution shape.

> Capture: _______________

**H-TY03** — Any numeric stat columns on this tab: do the numbers appear to align at the decimal place or ones-digit? Check by scanning a column vertically — ragged alignment signals proportional (not tabular) numerals.

> Capture: _______________

### Open capture

What felt off or effortful in the Stats tab?

> _______________

---

---

## Block 14 — `/agenda` Senate Almanac

### 2-second scan test

Navigate to `/agenda`. Look away, look back. Name the first thing you find — a law name, a vote outcome, a filter control. Is the primary purpose of the page immediately clear?

> Capture: _______________

### Heuristic probes

**H-A11Y07** — The canon flags `landmark-one-main: FAIL` on the `/agenda` route post-fix. With DevTools open, search for `<main>` elements: is there exactly one? Are there any duplicate `<main>` tags, or is the `<main>` landmark completely absent?

> Capture: _______________

**H-TY08** — If there is descriptive prose on the Almanac (agenda effect text, law descriptions): find the longest line and estimate its character count. Does it exceed ~80 characters? The sweet spot for comfortable reading is 45–75 characters; wider than 80 is a WCAG 1.4.8 concern.

> Capture: _______________

**H-A11Y06** — The Almanac likely presents agenda data in table form. Inspect the table markup: are all `<th>` elements in multi-column or multi-row headers carrying `scope="col"` or `scope="row"`? The canon flags a `td-has-header` failure on this route.

> Capture: _______________

### Open capture

What felt off or effortful in the Senate Almanac?

> _______________

---

---

## Block 15 — `/compare/:a/:b` Side-by-side compare

### 2-second scan test

Navigate to the Compare route (use the Compare picker on the home page to select two games). Look away, look back. Name the first meaningful difference between the two games you spot. Did it take more than a couple of seconds?

> Capture: _______________

### Heuristic probes

**H-DV06** — The Compare view places two games side-by-side. Is the layout structured as true small multiples — the same chart form at consistent scale for both games — or are the two games shown at different scales or in different chart types, making comparison harder than it should be?

> Capture: _______________

**H-DV08** — If the compare view uses a slope or ranked-change chart for any metric (e.g., VP trajectory, faction win delta): does the chart's question match the slope-chart form — "which entity rose or fell most between two states?" If not (e.g., if there are more than two comparison points), flag the chart type as potentially mismatched.

> Capture: _______________

**H-RS12** — At 375 px mobile width, does the side-by-side layout attempt to place two panels next to each other (forcing horizontal scroll) or does it reflow to stacked single-column? Horizontal scroll of the page shell at 320 px is a WCAG 1.4.10 violation; only the comparison charts themselves are excepted as true 2D content.

> Capture: _______________

### Open capture

What felt off or effortful in the Compare view?

> _______________

---

---

## Wrap-up

After all blocks are complete, review your open-capture notes and identify:

1. **The one most surprising find** — something a heuristic probe surfaced that you didn't expect.
2. **The one most effortful moment** — where you had to work hardest to extract information.
3. **Any screen where no heuristic felt violated** — which sections felt genuinely solid?

These three answers become the triage priority list for V1.3b UX work.
