# TI4 Hall of Records

A web app that parses, stores, and visualizes Twilight Imperium 4 game logs from TI Assistant.

The output is a **post-game newspaper-style recap and shareable infographic** — editorial broadsheet aesthetic, dense data viz, no flashy gamer UI.

## Status

- **Phase 0** (scaffolding) — ✅ complete
- **Phase 1a** (parser layer) — ✅ complete (146 tests, 95 % coverage, all 6 real game exports parse cleanly)
- **Phase 1b** (upload UI + Firestore) — next
- **Phase 2+** — single-game replay, meta-dashboard, polish

See [ROADMAP.md](ROADMAP.md) for the phased delivery plan.

## Docs

- **[ROADMAP.md](ROADMAP.md)** — phased delivery plan (source of truth; supersedes the Master Guidance Document)
- **[SKILLS.md](SKILLS.md)** — engineering playbook (TDD, folder structure, TypeScript rules)
- **[CLAUDE.md](CLAUDE.md)** — AI session context
- **[design_handoff_ti4_tracker/](design_handoff_ti4_tracker/)** — design direction (newspaper/almanac wireframes, type system, color tokens, 10 screen explorations)

## Design Direction — Newspaper / Almanac

The visual identity is **editorial broadsheet** — masthead, ruled dividers, drop caps, multi-column body, small-caps labels, hand-annotated margin notes. Inspired by historical almanacs and modern editorial design (think *The Economist* or *NYT* opinion-section data viz, **not** flashy gamer UIs).

This **supersedes the earlier "Deep Space" dark-theme direction**. Tailwind tokens, fonts, and the eventual hi-fi pass should target the newspaper aesthetic — see `design_handoff_ti4_tracker/README.md` for the full handoff.

### Type system

| Role | Family |
|---|---|
| Display / headlines | **Newsreader** (Google Fonts, weights 400/600/700/800 + italic) |
| Body / UI | **IBM Plex Sans** (400/500/600/700) |
| Data captions, labels, mono | **IBM Plex Mono** (400/600) |
| Margin annotations | **Caveat** (400/700) |

### Color tokens (CSS custom properties from `wireframes.css`)

```
--paper, --paper-2          warm newsprint backgrounds
--rule                      rule lines
--ink, --ink-2/3/4          primary → tertiary text
--accent                    faded vermillion ("stop press")
--cool                      faded ink-blue secondary accent
--gold, --moss              tech color tokens
```

Faction placeholder colors live in the wireframes; they need to be replaced with the official 25-faction palette before hi-fi.

### Screen catalogue (from the handoff)

10 screens × 4 variations each. The hero is **Screen 7 — VP Race** (slope chart, 6 lines, leader highlighted). The shareable centerpiece is **Screen 10 — End-Game Recap** (front-page final-edition broadsheet).

| # | Screen | Variations |
|---|---|---|
| 1 | Round / Phase Tracker | broadsheet · phone live-glance · timeline strip · radial clock |
| 2 | Initiative & Turn Order | numbered slate · NOW/NEXT queue · strategy card grid · radial table |
| 3 | Player Dashboard | dossier · phone tabbed · scoresheet card · radar profile |
| 4 | Combat Logger | two-col ledger · live feed · battle splits · phone tap-to-roll |
| 5 | Voting / Agenda | senate broadsheet · tally bars · slide-to-vote · senate almanac |
| 6 | Economy / Planet Board | radar overlay · hex grid · paired columns · trade sankey |
| 7 | **VP Race ★ HERO** | slope chart · standings bars · stadium · stacked stream |
| 8 | Objective Matrix | checkmark grid · bounty cards · player timeline · density heatmap |
| 9 | Faction Picker / Draft | carousel · roster grid · 3-up compare · phone snake-draft |
| 10 | End-Game Recap | front-page edition · by-the-numbers · awards · narrative timeline |

Implementation order suggested by the handoff: tokens → primitives → VP Race hero → end-game recap → always-visible chrome (round/initiative/dashboard) → everything else.

### Data shape alignment

The handoff's expected `GameLog` shape and our `ParsedGame` (output of `app/src/lib/parser/parseGame.ts`) overlap but are not identical. The mapping work — translating `ParsedGame` into the props each screen component needs — happens in Phase 2. The parser's contract is stable; new view-model derivations will sit alongside it.

## App

See [`app/README.md`](app/README.md) for dev setup and commands.

## Constraints worth remembering

- **Factions are the alignment axis.** All aggregate stats key on `factionId`, never on `playerName`. Players change every game.
- **Player names are anonymized by default.** First-name attribution is opt-in (Phase 3.5).
- **TDD is mandatory** in `app/src/lib/`. ≥ 90 % line coverage.
- **No `any` types** outside the schema boundary (`tsconfig.app.json` has `strict: true` + `noUncheckedIndexedAccess: true` + `exactOptionalPropertyTypes: true`).
- **Firestore SDK is confined to `app/src/adapters/firestore.ts`.** Nothing else imports it.
