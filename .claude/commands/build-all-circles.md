---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
description: Build all 9 Dante circle levels using a parallel agent swarm
---

Build all 9 circle levels from their design documents using the LevelEditor API.

## Required Context

Read these FIRST:
1. `docs/agents/level-editor-api.md` — LevelEditor API reference
2. `docs/agents/circle-building-guide.md` — How to translate designs to code

## Process

1. Dispatch parallel `@level-builder` agents (3 groups of 3):
   - Group 1: Circles 1, 2, 3
   - Group 2: Circles 4, 5, 6
   - Group 3: Circles 7, 8, 9

2. Each agent reads its circle design doc and writes `scripts/build-circle-N.ts`

3. After all scripts are written:
   - Run `npx tsc --noEmit` to verify all compile
   - Create `scripts/build-all-circles.ts` that imports and runs all 9 in sequence
   - Run `scripts/build-all-circles.ts` to populate `assets/levels.db`

4. Dispatch parallel `@level-reviewer` agents to cross-reference each script against its design doc

5. Fix any issues found by reviewers

6. Run playtest on all levels using `scripts/playtest-all.ts`

## Design Documents

- `docs/circles/01-limbo.md` — Circle 1: Limbo (fog)
- `docs/circles/02-lust.md` — Circle 2: Lust (wind)
- `docs/circles/03-gluttony.md` — Circle 3: Gluttony (poison)
- `docs/circles/04-greed.md` — Circle 4: Greed (hoarding)
- `docs/circles/05-wrath.md` — Circle 5: Wrath (escalation)
- `docs/circles/06-heresy.md` — Circle 6: Heresy (illusion)
- `docs/circles/07-violence.md` — Circle 7: Violence (bleeding)
- `docs/circles/08-fraud.md` — Circle 8: Fraud (mimics)
- `docs/circles/09-treachery.md` — Circle 9: Treachery (reflected shots)
