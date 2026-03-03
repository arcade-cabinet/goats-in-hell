# Contributing to Goats in Hell

## Getting Started

**Install Git LFS before cloning** — all binary assets (`.glb`, `.ogg`, `.wasm`) are tracked via LFS:

```bash
git lfs install
git clone git@github.com:arcade-cabinet/goats-in-hell.git
cd goats-in-hell
pnpm install
npx expo start --web --port 8085
```

## Git LFS

This repo uses [Git Large File Storage](https://git-lfs.com/) for binary assets.

**If you already cloned without LFS:**

```bash
git lfs install
git lfs pull
```

**Checking LFS status:**

```bash
git lfs status      # staged LFS files
git lfs ls-files    # all tracked LFS files
```

### LFS-Tracked Extensions

See `.gitattributes` for the full list. Key types:

| Extension | Used for |
|-----------|----------|
| `.glb` | 3D models and animations |
| `.ogg` | Music and SFX |
| `.wasm` | Physics and SQLite WASM |

### GLB File Sizes

Character animation GLBs can be large (6–9 MB per animation file). This is expected — skeletal animations include keyframe data for 339+ bones. Lossless compression via gltf-transform is not applied to animation files because precision loss can cause visible artifacts in bone interpolation.

If you're adding new animation files, check the size and prefer Meshy's built-in Draco export when available.

## Development Commands

```bash
pnpm test          # Jest unit tests (run pnpm test -- --verbose to see count)
pnpm lint          # Biome 2.4 check
pnpm lint:fix      # Biome auto-fix
pnpm format        # Biome format
npx tsc --noEmit   # TypeScript check

# Asset manifest validation
node scripts/validate-manifests.mjs
```

## Code Style

- **Linter:** Biome 2.4 (not ESLint — do not add `eslint-disable` comments)
- **Package manager:** pnpm (not npm or yarn)
- **Port:** Dev server always on port 8085

## Branching

- `main` — protected, requires PR
- `feat/*` — new features
- `fix/*` — bug fixes
- `chore/*` — maintenance

## Adding New 3D Assets

1. Generate via Meshy or export from Blender as GLB
2. Place in `public/models/<category>/<id>/`
3. Add a `manifest.json` with pipeline metadata and artifact references
4. Register in `src/game/systems/AssetRegistry.ts`
5. Run `node scripts/validate-manifests.mjs` to confirm manifest integrity
6. Commit — LFS handles binary tracking automatically

## CI

Pull requests run:

- Unit tests (Jest)
- TypeScript type check
- Biome lint
- Asset manifest validation (`scripts/validate-manifests.mjs`)

All checks must pass before merging.
