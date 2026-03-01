---
name: asset-pipeline
description: Asset import, optimization, registration, and validation pipeline
---

# Asset Import Pipeline

Complete workflow for importing game assets into the project.

## Pipeline Steps

### Step 1: Import the Model
- Copy the source model (GLB, FBX, or OBJ) into the appropriate `assets/` subdirectory
- Naming convention: `<category>-<name>.glb`
  - Weapons: `weapon-<name>.glb`
  - Enemies: `enemy-<name>.glb`
  - Bosses: `boss-<name>.glb`
  - Props: `prop-<name>.glb`
  - Projectiles: `bullet-<name>.glb`, `shell.glb`, `rocket.glb`

### Step 2: Optimize the Asset
- **Textures:** Compress to JPEG, downscale to 1024px max
  - Use ImageMagick: `convert input.png -resize 1024x1024 -quality 85 output.jpg`
  - Only keep PNG for textures requiring alpha transparency
- **GLB Compression:** Apply Draco compression via gltf-transform
  ```bash
  npx gltf-transform draco input.glb output.glb
  ```
- **Texture atlas:** For models with many textures, bake to a single atlas
  ```bash
  npx gltf-transform merge-textures input.glb output.glb
  ```

### Step 3: Verify Size Limits
| Category | Max Size |
|----------|----------|
| Weapon GLB | 300KB |
| Enemy GLB | 2MB |
| Boss GLB | 3MB |
| Prop GLB | 100KB |
| Projectile GLB | 250KB |
| Texture | 1024px max dimension |

### Step 4: Register in AssetRegistry
- Add an entry to `src/game/systems/AssetRegistry.ts`
- Include the asset path, type, and any metadata (poly count, texture size)

### Step 5: Wire to ECS
- If this is a new entity type, define the component in `src/game/entities/components.ts`
- Create or update the R3F renderer in `src/r3f/entities/` or `src/r3f/weapons/`
- Use the template+clone instancing pattern for enemies (see `EnemyMesh.tsx`)
- Use `useGLTF` from drei for loading

### Step 6: Validate
**Agent:** `@asset-validator`
**Command:** `/audit-assets`

- Verify size limits
- Verify naming conventions
- Verify registry completeness
- Check for orphaned assets

## Checklist

- [ ] Asset file copied to correct `assets/` subdirectory
- [ ] Filename follows naming convention (lowercase, hyphenated, category prefix)
- [ ] Textures compressed to JPEG, 1024px max
- [ ] GLB Draco-compressed
- [ ] File size within category limit
- [ ] Entry added to `AssetRegistry.ts`
- [ ] R3F renderer created/updated
- [ ] ECS component defined (if new entity type)
- [ ] Asset audit passes (`/audit-assets`)

## User Asset Libraries

- AmbientCG textures: `/Volumes/home/assets/AmbientCG`
- Weapon models: Stylized Guns 3D Models PRO (already imported)
- Boss models: Dainir for Genesis 9 (DAZ Studio pipeline)

## Boss Model Pipeline (Special)

Boss models follow a more complex pipeline documented in `docs/boss-pipeline.md`:
1. DAZ Studio export with Dainir base
2. Blender ARP Smart rigging (348 bones)
3. Texture atlas bake (2048x2048 JPEG)
4. Draco-compressed GLB export (target: 1.1-2.5MB)
