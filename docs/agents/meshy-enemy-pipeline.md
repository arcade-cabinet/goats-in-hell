---
title: "Meshy Enemy Generation Pipeline"
status: implemented
created: "2026-03-03"
domain: agents, assets
related:
  - AGENTS.md
  - docs/boss-pipeline.md
  - scripts/generate-assets.mjs
  - scripts/download-enemy-models.mjs
  - scripts/run-enemy-animations.mjs
---

# Meshy Enemy Generation Pipeline

Complete reference for generating, downloading, and wiring new enemy models.

---

## Directory Structure

All enemy assets live under **`public/models/enemies/`** (NOT `assets/`):

```
public/models/enemies/
  general/                    ← General-purpose mobs (goat-grunt, goat-scout, goat-brute, goat-shaman)
  bosses/                     ← One per circle (boss-il-vecchio … boss-azazel)
  circle-1/
    goat-shade/               ← Standard Circle 1 enemy
    goat-shade-whelp/         ← Circle 1 tier 1 (fodder)
    goat-shade-elder/         ← Circle 1 tier 3 (mini-boss)
  circle-2/ … circle-9/       ← Same 3-file structure per circle
```

Each enemy directory contains:
```
<enemy-dir>/
  manifest.json              ← Generation prompts + task state (source of truth)
  model.glb                  ← Rigged base model (downloaded after generation)
  animations/
    Zombie_Walk.glb          ← Individual animation clip GLBs
    Angry_Ground_Stomp.glb
    …
```

---

## Manifest Format

New manifests need only the prompt fields — `tasks` is filled in by content-gen:

```json
{
  "id": "goat-shade-whelp",
  "name": "Shade Whelp",
  "type": "character",
  "pipeline": "enemy",
  "description": "Lore description for designers and agents.",
  "textToImageTask": {
    "prompt": "Full A-pose character reference image prompt",
    "generateMultiView": true,
    "poseMode": "a-pose"
  },
  "textTo3DPreviewTask": {
    "prompt": "Body-only prompt — NO weapons, cloaks, or accessories that occlude limbs (causes rigging failure)",
    "artStyle": "realistic",
    "targetPolycount": 6000,
    "topology": "quad",
    "shouldRemesh": true,
    "symmetryMode": "auto"
  },
  "textTo3DRefineTask": {
    "texturePrompt": "Detailed texture/surface description. Accessories go here.",
    "enablePbr": true
  },
  "riggingTask": {
    "heightMeters": 1.5
  },
  "animationTask": {
    "animations": [
      "WalkAndRun.Walking.Zombie_Walk",
      "DailyActions.Idle.Angry_Ground_Stomp",
      "Fighting.AttackingwithWeapon.Left_Slash",
      "Fighting.GettingHit.Face_Punch_Reaction",
      "Fighting.Dying.Knock_Down"
    ]
  }
}
```

### CRITICAL: `textTo3DPreviewTask.prompt` must be body-only
Meshy's pose estimation fails when the preview prompt includes weapons, large cloaks,
or accessories that occlude limbs. These should ONLY appear in `textTo3DRefineTask.texturePrompt`.

### Height guide
- Whelps: 1.2–1.5m
- Standard: 1.6–1.8m
- Elders: 2.0–2.6m

---

## Generation Commands

```bash
# All enemies (skips already-SUCCEEDED steps)
node scripts/generate-assets.mjs enemies

# Single circle group
node scripts/generate-assets.mjs enemies --group circle-3

# Single enemy
node scripts/generate-assets.mjs enemies goat-glutton-elder

# Single step only (useful for resuming after failure)
node scripts/generate-assets.mjs enemies --step rigging goat-glutton-elder
```

Timeout: 30 minutes per enemy (covers concept→preview→refine→rigging pipeline).

---

## Download Models

After rigging is `SUCCEEDED`, download the base model GLBs:

```bash
# All enemies
node scripts/download-enemy-models.mjs

# Single group
node scripts/download-enemy-models.mjs --group circle-3

# Single enemy
node scripts/download-enemy-models.mjs goat-glutton-elder

# Preview what would download
node scripts/download-enemy-models.mjs --dry-run
```

---

## Generate Animations

**ALWAYS use `run-enemy-animations.mjs` for animations — NOT content-gen.**

The content-gen CLI has a bug where it sends `action_id` as a string but
the Meshy API requires an integer. The custom script bypasses this:

```bash
# All rigged enemies
node scripts/run-enemy-animations.mjs

# Single group
node scripts/run-enemy-animations.mjs --group circle-3

# Single enemy
node scripts/run-enemy-animations.mjs goat-glutton-elder
```

### Available Animation Paths → Action IDs

```
WalkAndRun.Walking.Zombie_Walk          → 112  (slow deliberate walk)
WalkAndRun.Walking.Stumble_Walk         → 562  (clumsy stumble walk)
WalkAndRun.Running.Lean_Forward_Sprint  → 509  (full sprint)

DailyActions.Idle.Angry_Ground_Stomp   → 255
DailyActions.Idle.Angry_Ground_Stomp_1 → 256
DailyActions.Idle.Angry_Ground_Stomp_2 → 257
Fighting.Transitioning.Chest_Pound_Taunt → 88  (imposing taunt)

Fighting.GettingHit.Face_Punch_Reaction   → 174
Fighting.GettingHit.Face_Punch_Reaction_1 → 175
Fighting.GettingHit.Face_Punch_Reaction_2 → 176
Fighting.GettingHit.BeHit_FlyUp           → 7   (dramatic knockback)

Fighting.Dying.Knock_Down                      → 187
Fighting.Dying.Knock_Down_1                    → 190
Fighting.Dying.Dead                            → 8
Fighting.Dying.Electrocuted_Fall               → 181
Fighting.Dying.Fall_Dead_from_Abdominal_Injury → 188
Fighting.Dying.Shot_and_Blown_Back             → 182

Fighting.AttackingwithWeapon.Charged_Axe_Chop → 237
Fighting.AttackingwithWeapon.Axe_Spin_Attack   → 238
Fighting.AttackingwithWeapon.Charged_Slash     → 242
Fighting.AttackingwithWeapon.Thrust_Slash      → 240
Fighting.AttackingwithWeapon.Left_Slash        → 97

Fighting.CastingSpell.Charged_Spell_Cast    → 125
Fighting.CastingSpell.Charged_Spell_Cast_1  → 126
Fighting.CastingSpell.Charged_Ground_Slam   → 127
Fighting.CastingSpell.mage_soell_cast       → 129  (note: typo is in Meshy API)

Fighting.Punching.Fast_Punch_Combo → 198
Fighting.Punching.Hook_Punch       → 193

BodyMovements.Acting.Mummy_Stagger → 113
BodyMovements.Acting.Zombie_Scream → 386
```

---

## Wiring New Enemies into the Game

After a new enemy has `model.glb` and animation GLBs, wire it into 5 files:

### 1. `src/game/entities/components.ts`
Add new types to the `EntityType` union:
```typescript
| 'gluttonWhelp' | 'glutton' | 'gluttonElder'
```

### 2. `src/db/LevelEditor.ts`
Add constants to `ENEMY_TYPES` object:
```typescript
GLUTTON_WHELP: 'gluttonWhelp',
GLUTTON: 'glutton',
GLUTTON_ELDER: 'gluttonElder',
```

### 3. `src/game/systems/AssetRegistry.ts`
Add model path and animation entries:
```typescript
// ENEMY_MODEL_ASSETS
'enemy-gluttonWhelp': 'models/enemies/circle-3/goat-glutton-whelp/model.glb',
'enemy-glutton': 'models/enemies/circle-3/goat-glutton/model.glb',
'enemy-gluttonElder': 'models/enemies/circle-3/goat-glutton-elder/model.glb',

// ENEMY_ANIMATION_ASSETS (one entry per animation clip)
'enemy-gluttonWhelp': {
  walk: 'models/enemies/circle-3/goat-glutton-whelp/animations/Stumble_Walk.glb',
  idle: 'models/enemies/circle-3/goat-glutton-whelp/animations/Angry_Ground_Stomp.glb',
  attack: 'models/enemies/circle-3/goat-glutton-whelp/animations/Fast_Punch_Combo.glb',
  hit: 'models/enemies/circle-3/goat-glutton-whelp/animations/Face_Punch_Reaction.glb',
  death: 'models/enemies/circle-3/goat-glutton-whelp/animations/Knock_Down.glb',
},
```

### 4. `src/r3f/entities/EnemyMesh.tsx`
Add to `ENEMY_CONFIGS` (visual properties) and `ENEMY_TYPES` Set.

### 5. `config/enemies.json`
Add base stats entry. Whelps ≈ 50% of standard HP/damage, Elders ≈ 175%.

### 6. `src/game/systems/AISystem.ts`
Add to both switch statements:
- `createVehicleForEnemy`: assign steering archetype (seek/flee/fast)
- `postSteering` main switch: assign behavior archetype

### 7. `src/db/PlaytestRunner.ts`
Add to the `ENEMY_TYPES` const Set (line ~65).

---

## Enemy Archetype Reference

| Archetype | YUKA Behavior | Examples |
|-----------|---------------|---------|
| `basicGoat` | SeekBehavior (direct charge) | goat, hellgoat, glutton, hoarder, frost, shade tiers |
| `fireGoat` | ArriveBehavior + FleeBehavior (ranged kiter) | fireGoat, shaman, heretic tiers |
| `shadowGoat` | SeekBehavior at 1.5× speed (fast ambusher) | shadowGoat, siren tiers, mimic tiers, butcherWhelp |
| `goatKnight` | SeekBehavior (armored heavy) | goatKnight, hoarderElder, frostElder, butcherElder |

---

## 3-Tier Design Conventions

| Tier | Key words | Scale | Score | Placement |
|------|-----------|-------|-------|-----------|
| **Whelp** | weak, frantic, pitiable, clumsy | 0.65–0.75× | ~40% of standard | Entry rooms, corridors, swarms |
| **Standard** | core threat, circle's signature | 1.0× | 100% | Mid-rooms, arenas, patrols |
| **Elder** | mini-boss, lore-weight, imposing | 1.55–1.75× | ~180–200% | Late rooms, arena waves, guard positions |

---

## Checklist: Adding a Complete New Circle Enemy Hierarchy

- [ ] Create `public/models/enemies/circle-N/goat-X-whelp/manifest.json`
- [ ] Create `public/models/enemies/circle-N/goat-X/manifest.json` (if new)
- [ ] Create `public/models/enemies/circle-N/goat-X-elder/manifest.json`
- [ ] Run `node scripts/generate-assets.mjs enemies --group circle-N`
- [ ] Run `node scripts/download-enemy-models.mjs --group circle-N`
- [ ] Run `node scripts/run-enemy-animations.mjs --group circle-N`
- [ ] Wire into `components.ts` (EntityType union)
- [ ] Wire into `LevelEditor.ts` (ENEMY_TYPES constants)
- [ ] Wire into `AssetRegistry.ts` (model paths + animation paths)
- [ ] Wire into `EnemyMesh.tsx` (ENEMY_CONFIGS + ENEMY_TYPES Set)
- [ ] Wire into `enemies.json` (base stats)
- [ ] Wire into `AISystem.ts` (both switch statements)
- [ ] Wire into `PlaytestRunner.ts` (ENEMY_TYPES Set)
- [ ] Rebuild levels: `npx tsx scripts/build-all-circles.ts`
- [ ] Verify playtests pass: `npx tsx scripts/build-all-circles.ts` (includes playtest)
