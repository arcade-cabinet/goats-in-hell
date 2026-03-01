---
title: "Agent Reference Index"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: agents
related:
  - docs/AGENTS.md
  - AGENTS.md
---

# Agent Reference Index

> **For Claude:** These are the reference docs that agents read when building or reviewing levels. Read them before ANY level-related work.

---

## Documents

| Doc | Status | Description | When to Read |
|-----|--------|-------------|--------------|
| [level-editor-api.md](level-editor-api.md) | implemented | Complete LevelEditor API reference with examples | Before ANY level building |
| [circle-building-guide.md](circle-building-guide.md) | implemented | How to translate design docs into API calls | Before building a circle |

---

## Usage Pattern

1. **Always read `level-editor-api.md` first** -- it defines every method, constant, and type
2. **Then read `circle-building-guide.md`** -- it shows how to translate design doc patterns into LevelEditor calls
3. **Then read the specific circle design doc** from `docs/circles/0N-*.md`

The `@level-builder` agent loads these automatically. If you are working on levels manually, load them yourself.

---

## See Also

- [docs/AGENTS.md](../AGENTS.md) — Master documentation index
- [Root AGENTS.md](../../AGENTS.md) — Agent infrastructure (custom agents, commands, workflows)
