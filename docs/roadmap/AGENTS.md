---
title: "Roadmap Index"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: roadmap
related:
  - docs/AGENTS.md
  - docs/roadmap/README.md
---

# Roadmap Index

> **For Claude:** This supplements `README.md` with status tracking and staleness warnings. Check both.

---

## Roadmap Domains

| Order | Domain | Doc | Priority | Status |
|-------|--------|-----|----------|--------|
| 0 | Overview | [README.md](README.md) | — | in-progress |
| 1 | Ship It (Production) | [01-ship-it.md](01-ship-it.md) | critical | in-progress |
| 2 | Bug Fixes | [02-bug-fixes.md](02-bug-fixes.md) | high | in-progress |
| 3 | Missing Features | [03-missing-features.md](03-missing-features.md) | medium | in-progress |
| 4 | Architecture Refactor | [04-architecture.md](04-architecture.md) | medium | **superseded** |
| 5 | Testing | [05-testing.md](05-testing.md) | medium | **superseded** |
| 6 | Polish | [06-polish.md](06-polish.md) | low | in-progress |

---

## Staleness Warnings

- **04-architecture.md** references Babylon.js "god-files" (`GameEngine.tsx` at 2027 lines, `BabylonHUD.ts` at 2010 lines). The R3F rewrite (PR #4) eliminated these files entirely. Architecture concerns are now different.
- **05-testing.md** says "Zero test coverage today." The project now has 268 tests across 22 suites (`pnpm test`). Testing strategy needs a fresh assessment.
- **README.md** "Current State" section is dated 2026-02-27 and references "4 bosses" — the project now has 9 boss designs. Asset counts may be stale.

---

## See Also

- [docs/AGENTS.md](../AGENTS.md) — Master documentation index
- [docs/plans/AGENTS.md](../plans/AGENTS.md) — Design and implementation plans
