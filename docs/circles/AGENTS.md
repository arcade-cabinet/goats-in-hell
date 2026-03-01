---
title: "Circle Design Index"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
related:
  - docs/AGENTS.md
  - docs/GAME-BIBLE.md
  - docs/agents/level-editor-api.md
---

# Circle Design Index

> **For Claude:** Use this table to find the right circle doc, check build status, and locate playtest reports.

---

## Circle Summary

| # | Name | Sin | Doc | Build Script | Status | Act | Boss | Mechanic |
|---|------|-----|-----|-------------|--------|-----|------|----------|
| 0 | Player Journey | — | [00-player-journey.md](00-player-journey.md) | — | implemented | — | — | — |
| 1 | Limbo | ignorance | [01-limbo.md](01-limbo.md) | `scripts/build-circle-1.ts` | implemented | 1 | Il Vecchio | fog-of-war |
| 2 | Lust | desire | [02-lust.md](02-lust.md) | `scripts/build-circle-2.ts` | implemented | 1 | Caprone | siren-pulls |
| 3 | Gluttony | excess | [03-gluttony.md](03-gluttony.md) | `scripts/build-circle-3.ts` | implemented | 1 | Vorago | poisoned-pickups |
| 4 | Greed | avarice | [04-greed.md](04-greed.md) | `scripts/build-circle-4.ts` | implemented | 2 | Aureo | hoarding-penalty |
| 5 | Wrath | rage | [05-wrath.md](05-wrath.md) | `scripts/build-circle-5.ts` | implemented | 2 | Furia | escalation |
| 6 | Heresy | defiance | [06-heresy.md](06-heresy.md) | `scripts/build-circle-6.ts` | implemented | 2 | Profano | illusion-walls |
| 7 | Violence | bloodshed | [07-violence.md](07-violence.md) | `scripts/build-circle-7.ts` | implemented | 3 | Il Macello | bleeding |
| 8 | Fraud | deception | [08-fraud.md](08-fraud.md) | `scripts/build-circle-8.ts` | implemented | 3 | Inganno | mimic-enemies |
| 9 | Treachery | betrayal | [09-treachery.md](09-treachery.md) | `scripts/build-circle-9.ts` | implemented | 3 | Azazel | reflected-shots |

---

## Playtest Reports

| Act | Circles | Report | Status |
|-----|---------|--------|--------|
| 1 | 1-3 | [playtest-act1.md](playtest-act1.md) | implemented |
| 2 | 4-6 | [playtest-act2.md](playtest-act2.md) | implemented |
| 3 | 7-9 | [playtest-act3.md](playtest-act3.md) | implemented |

---

## Act Structure

- **Act 1 (Circles 1-3):** Tutorial arc. Teaches movement, combat, resource management. Weapons: Hell Pistol, Brim Shotgun.
- **Act 2 (Circles 4-6):** Escalation arc. Introduces economy, rage, and deception. Weapon: Hellfire Cannon.
- **Act 3 (Circles 7-9):** Mastery arc. Bleeding, mimics, reflected shots. Weapon: Goat's Bane (Bazooka). Flamethrower unlocked in Circle 9.

---

## See Also

- [docs/AGENTS.md](../AGENTS.md) — Master documentation index
- [docs/agents/level-editor-api.md](../agents/level-editor-api.md) — LevelEditor API reference
- [docs/agents/circle-building-guide.md](../agents/circle-building-guide.md) — Design doc to code translation guide
