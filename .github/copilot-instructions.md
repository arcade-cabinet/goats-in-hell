# Goats in Hell — Copilot Instructions

## Quick Facts

- **Package manager:** pnpm (NOT npm or yarn)
- **Linter/formatter:** Biome 2.4 (NOT ESLint or Prettier)
- **3D engine:** Three.js + React Three Fiber v9 + @react-three/rapier (NOT Babylon.js)
- **ECS:** Miniplex
- **State:** Zustand (`useGameStore`)
- **Dev server:** `npx expo start --web --port 8085` (port 8085 required)

## Coordinate System

- ALL level coordinates are GRID coordinates (not world units)
- 1 grid cell = 2 world units (`CELL_SIZE = 2`)
- X increases eastward, Z increases southward (top-left origin)
- Three.js is right-handed: positive Z points toward camera

## Critical Rules

1. **pnpm only** — never `npm install` or `yarn`
2. **Biome only** — never ESLint/Prettier configs or commands
3. **Grid coordinates** — entities and rooms use grid coords, not world coords
4. **No `new Vector3()` in `useFrame()`** — reuse module-scope temp vectors to avoid per-frame allocation
5. **Always dispose materials** — Three.js materials/geometries must be manually disposed to prevent WebGL memory leaks
6. **Projectile combat** — ALL weapons fire visible projectiles (no hitscan)
7. **Shared AudioContext** — all audio systems share a single Web Audio context via `sharedAudioContext.ts`

## Key Commands

```bash
pnpm test          # Jest (268 tests)
pnpm lint          # Biome check
pnpm lint:fix      # Biome auto-fix
pnpm format        # Biome format
npx tsc --noEmit   # TypeScript check
```

## Documentation

- `AGENTS.md` — Agent infrastructure (custom agents, commands, workflows)
- `docs/AGENTS.md` — Master documentation index with frontmatter schema
- `docs/agents/level-editor-api.md` — LevelEditor API reference
- `docs/circles/AGENTS.md` — Circle design docs index (9 circles of Dante's Inferno)
- `memory-bank/AGENTS.md` — Memory bank index (if present)
