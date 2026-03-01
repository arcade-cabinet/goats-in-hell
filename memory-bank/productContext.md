---
title: "Product Context"
description: "Game design context — premise, structure, mechanics, and design principles"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, game-design, product]
---

# Product Context

## Premise

You are the Scapegoat. In Leviticus 16, two goats are brought before the altar on Yom Kippur. One is sacrificed to God. The other — the scapegoat — is laden with the sins of the community and cast into the wilderness toward Azazel. That goat is you.

You fell through the wilderness, through the earth, into Hell itself. Now you descend through the Nine Circles, bearing sins that are not yours, burning everything in your path with fire that was never meant for purification — but has become it anyway.

At the bottom waits Azazel. The fallen angel. The one you were sent to.

**Genre:** First-person dungeon crawler / FPS through Dante's 9 circles of Hell, featuring goat demons.

## Tone

**Allegorically serious, mechanically absurd.**

The Dante framework is played straight — contrapasso (punishment fits the sin), theological weight, descent toward absolute evil. The writing takes this seriously. But the protagonist is a goat with a flamethrower.

Comedy comes from the juxtaposition, never from jokes. The goat never speaks. The bosses monologue with genuine menace about sins and punishment — to a goat. The player feels the absurdity without anyone pointing at it.

Not DOOM with goats (too serious). Not Goat Simulator in hell (too stupid). The middle path: a game that makes you feel something uncomfortable about scapegoating while you shoot demonic goats with a brimstone shotgun.

## Three-Act Structure

### Act 1: Ignorance (Circles 1-3)
The player knows nothing. The mechanics are cruel teachers.
- **Circle 1 — Limbo (Ignorance):** Dense fog, visibility ~8 cells. Learn to listen before shooting.
- **Circle 2 — Lust (Desire):** Wind zones pull toward lava hazards. Learn to resist.
- **Circle 3 — Gluttony (Excess):** Poisoned pickups (50/50 health/poison). Learn to question abundance.

### Act 2: Temptation (Circles 4-6)
The player has weapons and knows combat. Now the game tests discipline.
- **Circle 4 — Greed (Avarice):** Hoarding penalty — excess ammo slows movement. Learn to let go.
- **Circle 5 — Wrath (Rage):** Escalation — enemy speed increases over combat duration. Learn to kill fast.
- **Circle 6 — Heresy (Defiance):** Illusion walls — fake walls, trap floors. Learn to trust nothing.

### Act 3: Descent (Circles 7-9)
The player is hardened. The game stops teaching and starts punishing.
- **Circle 7 — Violence (Bloodshed):** Bleeding — constant 1 HP/sec drain, kills restore 10 HP. Pacifism is suicide.
- **Circle 8 — Fraud (Deception):** Mimic enemies — pickups that attack on proximity. Paranoia is survival.
- **Circle 9 — Treachery (Betrayal):** Reflected shots — missed projectiles bounce back. Your own violence turns against you.

## The Nine Circles and Bosses

| # | Circle | Sin | Boss | Base | Key Visual |
|---|--------|-----|------|------|------------|
| 1 | Limbo | Ignorance | Il Vecchio (The Old One) | Male | Ancient patriarch, gatekeeper |
| 2 | Lust | Desire | Caprone | Female | Hermaphroditic Baphomet, dual-gendered |
| 3 | Gluttony | Excess | Vorago | Female | Grotesque mother, earth-devourer |
| 4 | Greed | Avarice | Aureo | Female | Vain adorned she-goat, Salome figure |
| 5 | Wrath | Rage | Furia | Male | Hyper-masculine, maximum rage |
| 6 | Heresy | Defiance | Profano | Female | Witch, heretical priestess |
| 7 | Violence | Bloodshed | Il Macello (The Butcher) | Male | Brute Minotaur, the Butcher |
| 8 | Fraud | Deception | Inganno | Female | Beautiful deceiver, Geryon face |
| 9 | Treachery | Betrayal | Azazel | Male | The fallen angel, scapegoat's destination |

Boss names use Italian/Latin nomenclature rooted in Dante's language. Each name means what the boss is.

## Weapons

| Weapon | Model | Found | Notes |
|--------|-------|-------|-------|
| Hell Pistol | MAC-10 | Start | Reliable, long range, low DPS |
| Brim Shotgun | Shotgun | Procedural floors before Circle 2 | Close range, high burst |
| Hellfire Cannon | AK-47 | Procedural floors before Circle 3 | Sustained DPS, medium range |
| Goat's Bane | Bazooka | Circle 5 Arsenal room | Rockets, area damage, slow fire rate |
| Brimstone Flamethrower | Flamethrower | Circle 7 Shrine room | Continuous stream, short range, DOT — the destiny weapon |

All weapons fire visible projectiles. No hitscan. The flamethrower uses a fuel system (100 max, 5 fuel/sec burn, 1 fuel/sec passive regen).

Melee: Ram attack (sprint into enemies) — 15 HP damage, 1-second cooldown. Last resort, not a primary tool.

## Enemy Types

| Type | Goatman Variant | First Appears | Role |
|------|-----------------|---------------|------|
| hellgoat | Brown | Circle 1 | Base melee enemy |
| fireGoat | Crimson | Circle 2 | First ranged enemy |
| hellgoat (green) | Green | Circle 3 | Reskinned hellgoat |
| goatKnight | Dark | Circle 4 | First armored enemy (tanky, slow) |
| shadowGoat | Gray | Circle 6 | First invisible enemy (glass cannon) |
| goatKnight (elite) | Blue | Circle 9 | Elite variant (reserved for final circle) |

6 texture variants of the Goatman model (ms03_05_Goatman), each with 11 animations: idle, walk, run, attack_01/02/03, damage_01/02, die, getup, stunned.

## Game Modes

- **Normal:** Standard experience
- **Nightmare:** No health pickups + 2x enemy damage
- **Permadeath:** No retry on death (single life)
- **Ultra Nightmare:** Nightmare + Permadeath combined

## Progression

- **Encounter sequencing:** 3 explore rooms, then 1 arena, then boss every 5 stages
- **XP from kills** via `awardXp(scoreValue)` with logarithmic leveling curve
- **Procedural floors:** 2 between each circle (16 total), using the NEXT circle's theme as foreshadowing. Higher pickup density for resource recovery. New weapons found here.
- **Total game length:** ~69 circle rooms + ~32 procedural rooms, ~300 enemies, ~2.5 hours

## The Ending

The game tracks a hidden metric: how many optional enemies the player skipped.

**Ascent Ending (>30% optional enemies skipped):** Camera pulls up through each circle in reverse. The scapegoat returns to the wilderness. The player showed restraint.

**Remain Ending (<30% optional enemies skipped):** The goat sits beside Azazel at the bottom of the world. The goat embraced the violence it was supposed to only carry. It belongs here now.

Subtle hints appear throughout: "Another sin carried deeper" (every 10th optional kill), "The weight grows" (entering new circle with >70% kills), "Blood remembered" (first optional kill per circle).

Circle 7's bleeding mechanic (forced kills for survival) counts as mandatory, not optional. The player is not penalized for violence the circle demands.

## Design Principles

1. **Every room tells a story** — no filler rooms, every space serves the circle's sin and narrative
2. **Escalating difficulty** — each circle introduces exactly one new mechanic tied to its sin
3. **Contrapasso** — the punishment fits the sin (Dante's principle applied to gameplay, not just lore)
4. **Silent protagonist** — the goat never speaks; players project onto it
5. **Lore via environment + bosses** — circle title cards (Dante quotes), boss monologues (2-3 sentences), environmental inscriptions. No Virgil NPC, no collectible lore, no audio logs.
6. **Strictly linear descent** — no hub, no level select, no backtracking. 9 circles, ~25 levels, ~2 hours.
7. **Theological framework played straight** — three traditions converge: Parable of Sheep and Goats (Matthew 25), the scapegoat ritual (Leviticus 16), and Azazel the fallen angel (Book of Enoch)

## Canonical Reference

For the full, authoritative game design document, see `/docs/GAME-BIBLE.md`. For the complete player journey narrative, see `/docs/circles/00-player-journey.md`. Individual circle designs are in `/docs/circles/01-limbo.md` through `/docs/circles/09-treachery.md`.
