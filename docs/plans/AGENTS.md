---
title: "Plans Index"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
related:
  - docs/AGENTS.md
---

# Plans Index

> **For Claude:** Check this index before creating a new plan. A design or implementation plan may already exist.

---

## Naming Convention

Plan filenames follow: `YYYY-MM-DD-<topic>-<type>.md`

- `<type>` is either `design` or `implementation`
- Design docs describe WHAT to build and WHY
- Implementation docs describe HOW to build it (phases, tasks, files)
- Every implementation plan should reference its design doc

---

## Plans

| Date | Title | Type | Status | Notes |
|------|-------|------|--------|-------|
| 2026-02-26 | [Goats in Hell Implementation (Babylon.js)](2026-02-26-goats-in-hell-implementation.md) | implementation | **superseded** | Pre-R3F. Superseded by 2026-02-28 circles plan. |
| 2026-02-26 | [Goats in Hell Transformation Design (Babylon.js)](2026-02-26-goats-in-hell-transformation-design.md) | design | **superseded** | Pre-R3F. References Babylon.js + Reactylon. |
| 2026-02-28 | [Dante's Circles Level System Design](2026-02-28-dante-circles-level-system-design.md) | design | implemented | Current level system architecture. |
| 2026-02-28 | [Dante's Circles Implementation Plan](2026-02-28-dante-circles-implementation-plan.md) | implementation | implemented | LevelEditor, GridCompiler, PlaytestRunner. |
| 2026-03-01 | [Circle 1: Limbo Design](2026-03-01-circle-1-limbo-design.md) | design | implemented | Duplicate of `docs/circles/01-limbo.md`. |
| 2026-03-01 | [Circle 1: Limbo Implementation](2026-03-01-circle-1-limbo-implementation.md) | implementation | implemented | First circle build script plan. |
| 2026-03-01 | [Open Questions Design](2026-03-01-open-questions-design.md) | design | in-progress | 10 open design questions from GAME-BIBLE. |

---

## Staleness Warnings

- **2026-02-26 plans** reference Babylon.js, Reactylon, and Havok physics. The project now uses Three.js, R3F v9, and Rapier. Do not use these as implementation guides.
- **2026-03-01 circle-1 design** is a copy of the canonical `docs/circles/01-limbo.md`. Edit the canonical version, not this copy.

---

## See Also

- [docs/AGENTS.md](../AGENTS.md) — Master documentation index
- [docs/roadmap/AGENTS.md](../roadmap/AGENTS.md) — Development roadmap (task-level priorities)
