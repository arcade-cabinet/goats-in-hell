---
title: "Documentation Index"
status: implemented
created: "2026-03-01"
updated: "2026-03-04"
domain: agents
related:
  - AGENTS.md
  - CLAUDE.md
---

# Documentation Index

> **For Claude:** This is the master index for all project documentation. Start here to find the right doc for any task.

---

## Frontmatter Schema

Every markdown doc in `docs/` has YAML frontmatter with these base fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Human-readable document title |
| `status` | enum | `implemented`, `in-progress`, `superseded` |
| `created` | date | ISO date the doc was created |
| `updated` | date | ISO date of last significant update |
| `domain` | enum | `circles`, `agents`, `plans`, `roadmap`, `pipelines`, `game-design` |
| `related` | list | Paths to related docs (relative to repo root) |

### Domain-Specific Extensions

**Circles** (`domain: circles`):

| Field | Description |
|-------|-------------|
| `circle_number` | 0-9 (0 = player journey overview) |
| `sin` | The circle's sin theme |
| `boss` | Boss name |
| `act` | 1, 2, or 3 |
| `build_script` | Path to the LevelEditor build script |
| `mechanic` | Dominant gameplay mechanic |

**Plans** (`domain: plans`):

| Field | Description |
|-------|-------------|
| `plan_type` | `design` or `implementation` |
| `superseded_by` | Path to the replacement doc (if `status: superseded`) |

**Roadmap** (`domain: roadmap`):

| Field | Description |
|-------|-------------|
| `priority` | `critical`, `high`, `medium`, `low` |
| `roadmap_order` | Sort order (0 = overview, 1-6 = domains) |

**Pipelines** (`domain: pipelines`):

| Field | Description |
|-------|-------------|
| `pipeline_type` | `asset-generation`, `asset-import`, etc. |
| `tools` | List of tools used in the pipeline |

---

## Documentation Map

### Top-Level

| Doc | Domain | Status | Description |
|-----|--------|--------|-------------|
| [GAME-BIBLE.md](GAME-BIBLE.md) | game-design | implemented | Canonical game design reference |
| [boss-pipeline.md](boss-pipeline.md) | pipelines | in-progress | Boss character creation pipeline |
| [DAZ-PIPELINE.md](DAZ-PIPELINE.md) | pipelines | implemented | DAZ-to-game asset import |

### Subdirectory Indexes

| Directory | Index | Doc Count | Description |
|-----------|-------|-----------|-------------|
| `docs/agents/` | [agents/AGENTS.md](agents/AGENTS.md) | 2 | Agent API reference and building guide |
| `docs/circles/` | [circles/AGENTS.md](circles/AGENTS.md) | 13 | Circle design docs and playtest reports |
| `docs/plans/` | [plans/AGENTS.md](plans/AGENTS.md) | 13 | Design and implementation plans |
| `docs/roadmap/` | [roadmap/AGENTS.md](roadmap/AGENTS.md) | 7 | Development roadmap domains |

---

## Quick Navigation

- **Building a circle?** Start at [circles/AGENTS.md](circles/AGENTS.md), then read the circle's design doc and [agents/level-editor-api.md](agents/level-editor-api.md)
- **Understanding game design?** Read [GAME-BIBLE.md](GAME-BIBLE.md) and [circles/00-player-journey.md](circles/00-player-journey.md)
- **Working on boss assets?** Read [boss-pipeline.md](boss-pipeline.md) and [DAZ-PIPELINE.md](DAZ-PIPELINE.md)
- **Planning new work?** Check [plans/AGENTS.md](plans/AGENTS.md) for existing plans, [roadmap/AGENTS.md](roadmap/AGENTS.md) for priorities
- **Looking for API reference?** See [agents/level-editor-api.md](agents/level-editor-api.md)
- **Working on AI/autoplay?** See Brain Architecture section in [root AGENTS.md](../AGENTS.md) — YUKA goal system, `PlayerGoalDriver`, `BrainRegistry`, A* pathfinding

---

## See Also

- [Root AGENTS.md](../AGENTS.md) — Agent infrastructure overview (custom agents, commands, workflows)
- [memory-bank/AGENTS.md](../memory-bank/AGENTS.md) — Memory bank index (if present)
