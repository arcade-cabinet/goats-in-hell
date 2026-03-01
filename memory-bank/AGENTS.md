---
title: "Memory Bank Guide"
description: "Master guide for the multi-agent memory bank system"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, agents, protocol]
---

# Memory Bank — Agent Guide

This directory contains persistent context files that give Claude Code agents memory across sessions. Every agent working on this project should follow the protocols below.

## File Structure

| File | Purpose | Read Frequency |
|------|---------|----------------|
| `activeContext.md` | Current session focus, in-progress work, next steps | **Every session start** |
| `progress.md` | Project milestones — completed, in-progress, not started | Before planning work |
| `decisionLog.md` | Architectural Decision Records (ADRs) | Before making architectural choices |
| `techContext.md` | Tech stack, patterns, gotchas, dev commands | Before writing code |
| `productContext.md` | Game design context — premise, structure, mechanics | Before design decisions |

## Session Start Protocol

1. **Read `activeContext.md` first.** This tells you what was last accomplished, what is in progress, and what the next steps are.
2. Read any other memory bank files relevant to your task.
3. Cross-reference with `CLAUDE.md` (project root) for critical rules and commands.
4. Cross-reference with `AGENTS.md` (project root) for agent infrastructure details.

## Session End Protocol

1. **Update `activeContext.md`** with:
   - What you accomplished this session
   - What is now in progress (if anything was left incomplete)
   - Updated next steps
   - Any new open questions
2. If you made an architectural decision, append it to `decisionLog.md` following the ADR format.
3. If the tech stack or patterns changed, update `techContext.md`.
4. If project milestones shifted, update `progress.md`.

## Decision Logging Protocol

Before making any architectural decision:

1. **Check `decisionLog.md`** for existing decisions that may constrain or inform your choice.
2. If your decision is new, append an ADR entry using the format in that file.
3. Use the next sequential ADR number (check the last entry).
4. Set `Status: accepted` for confirmed decisions, `Status: proposed` for suggestions needing review.

## Cross-References

- **Project guide:** `/CLAUDE.md` — dev commands, critical rules, tech stack summary
- **Agent infrastructure:** `/AGENTS.md` — custom agents, commands, workflows, LevelEditor API
- **Game design:** `/docs/GAME-BIBLE.md` — canonical design reference
- **Player journey:** `/docs/circles/00-player-journey.md` — full game script
- **Circle designs:** `/docs/circles/01-limbo.md` through `09-treachery.md`
- **Agent API docs:** `/docs/agents/level-editor-api.md`, `/docs/agents/circle-building-guide.md`

## Why This Matters

Claude Code agents have no memory between sessions. Without this memory bank, every new session starts from zero — the agent must re-discover project state, recent decisions, and current priorities by reading code and docs from scratch. The memory bank provides a curated, up-to-date snapshot that eliminates this cold-start problem.

**Keep these files accurate.** Stale memory is worse than no memory.
