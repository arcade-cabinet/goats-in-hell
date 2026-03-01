---
allowed-tools: Read, Grep, Glob, Bash
description: Review a circle build script against its design document for correctness
---

Review circle $ARGUMENTS build script against its design document.

## Files to Compare

1. Build script: `scripts/build-circle-$ARGUMENTS.ts`
2. Design doc: `docs/circles/0$ARGUMENTS-*.md`

## Review Checklist

Use the `@level-reviewer` agent to perform a thorough cross-reference:

1. **Rooms** — Every room in the design table exists with correct coordinates
2. **Connections** — Every connection exists with correct type and width
3. **Enemies** — Count and types match, positions inside room bounds
4. **Pickups** — All pickups present with correct types
5. **Triggers** — All triggers present with correct zones and actions
6. **Environment zones** — All zones present with correct bounds
7. **Metadata** — Theme, spawn, level dimensions all correct
8. **Bounds safety** — No entity outside level bounds

Report as: PASS / FAIL with itemized issues.
