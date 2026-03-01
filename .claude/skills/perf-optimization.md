---
name: perf-optimization
description: Performance optimization workflow for identifying and fixing render bottlenecks
---

# Performance Optimization Workflow

Systematic approach to finding and fixing performance bottlenecks in the R3F render pipeline. Target: 60fps on mid-range mobile.

## Pipeline Steps

### Step 1: Profile
**Agent:** `@performance-profiler`
**Command:** `/profile-level <id>`

Run a performance profile to identify bottlenecks:
- Material count audit
- Draw call estimation
- Per-frame allocation scan
- Entity budget analysis
- Texture memory estimation

### Step 2: Identify Root Cause

Common bottleneck categories ranked by impact:

#### Per-Frame Allocations (HIGH IMPACT)
- `new Vector3()` inside `useFrame()` causes GC stalls
- `new Quaternion()`, `new Matrix4()`, `new Euler()`, `new Color()`, `new Box3()`
- Array/object literals inside update loops
- `.clone()` calls inside `useFrame()`
- `.filter()`, `.map()` on entity arrays each frame

**Detection:**
```bash
# Search for allocations inside useFrame
grep -n "new Vector3\|new Quaternion\|new Matrix4\|new Euler\|new Color\|new Box3" src/r3f/**/*.tsx
```

#### Too Many Draw Calls (HIGH IMPACT)
- Each unique material+geometry combination = 1 draw call
- Uninstanced enemies multiply draw calls by entity count
- Too many point lights (each adds a shadow pass)

**Detection:** Count materials in `Materials.ts`, check instancing in `EnemyMesh.tsx`

#### Texture Memory (MEDIUM IMPACT)
- 4096px textures waste VRAM on mobile
- Uncompressed PNG where JPEG would suffice
- Duplicate textures not shared between materials

**Detection:** Check asset sizes in `assets/` directory

#### Overdraw / Fill Rate (MEDIUM IMPACT)
- Post-processing stack (Bloom is expensive)
- Transparent/alpha-blended materials
- Overlapping particle effects

**Detection:** Review `PostProcessing.tsx` settings

#### Physics Overhead (LOW IMPACT)
- Too many active colliders
- CCD on slow projectiles (unnecessary)
- Complex collision shapes where simple ones suffice

**Detection:** Count colliders in `EnemyColliders.tsx`

### Step 3: Fix

#### Fix: Per-Frame Allocations
```typescript
// BEFORE (bad)
useFrame(() => {
  const pos = new Vector3(x, y, z);  // allocates every frame!
});

// AFTER (good)
const _pos = new Vector3();  // module scope, allocated once
// ...
useFrame(() => {
  _pos.set(x, y, z);  // reuses existing object
});
```

#### Fix: Too Many Materials
- Share materials across meshes with the same appearance
- Use `MeshStandardMaterial` with texture atlases
- Define materials at module scope, not inside components

#### Fix: Too Many Draw Calls
- Use `InstancedMesh` for repeated objects (enemies, props)
- Merge static geometries with `BufferGeometryUtils.mergeGeometries()`
- Reduce point light count (use baked lighting where possible)

#### Fix: Large Textures
```bash
# Downscale to 1024px
convert input.png -resize 1024x1024 -quality 85 output.jpg
# Re-compress GLB with smaller textures
npx gltf-transform resize --width 1024 --height 1024 model.glb model-opt.glb
```

#### Fix: Post-Processing
- Reduce Bloom iterations (luminanceThreshold, intensity)
- Disable ChromaticAberration on mobile
- Use half-resolution for post-processing passes

### Step 4: Verify
**Command:** `/profile-level <id>` (re-run after fixes)

Verify the fix resolved the bottleneck:
- Draw calls decreased
- No per-frame allocations remain
- Texture memory within budget
- Frame rate stable at 60fps

## Performance Budgets

| Metric | Budget | Critical |
|--------|--------|----------|
| Draw calls | <200 | >300 |
| Materials | <20 | >30 |
| Active enemies | <50 | >75 |
| Active particles | <300 | >500 |
| Active projectiles | <100 | >150 |
| Texture VRAM | <128MB | >256MB |
| GLB total size | <50MB | >100MB |

## Checklist

- [ ] Profile completed, bottlenecks identified
- [ ] Root cause categorized (allocations / draw calls / textures / overdraw / physics)
- [ ] Fix applied
- [ ] Re-profile confirms improvement
- [ ] No regressions in other metrics
- [ ] Frame rate stable at 60fps target
