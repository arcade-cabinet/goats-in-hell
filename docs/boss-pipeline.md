---
title: "Boss Character Pipeline"
status: in-progress
created: "2026-02-28"
updated: "2026-03-01"
domain: pipelines
pipeline_type: asset-generation
tools:
  - Blender 5.0
  - DAZ Studio
  - Diffeomorphic DAZ Importer
  - Auto Rigger Pro
  - Blender MCP
related:
  - docs/DAZ-PIPELINE.md
  - docs/GAME-BIBLE.md
---

# Boss Character Pipeline — Dainir for Genesis 9

> Comprehensive documentation of the boss creation pipeline for Goats in Hell.
> Updated: 2026-03-01

---

## Overview

Each of the 9 circle bosses is created from the **Dainir for Genesis 9** (RawArt)
character base in Blender, using Diffeomorphic DAZ Importer. The pipeline produces
a single `.glb` file per boss (Draco-compressed, ~1MB) with a baked 2048x2048
JPEG diffuse atlas.

## Base Templates

| File | Contents | Shape Keys |
|------|----------|------------|
| `dainir-male-base.blend` | Male form, 26,492v, 313 bones, 8 materials, parts separate | 150 (106 corrective + 43 body + Basis) |
| `dainir-female-base.blend` | Female form, both anatomies, parts separate | 159 (106 corrective + 53 body + Basis) |

**Parts present in base:** Antler Mesh (1,776v), Hooves Mesh (1,430v), Leg Fur (24,775v), Hoof Fur (4,164v)

**Parts NOT in base (known gap):** Goatee (Raw Dainir Goatee.duf) — never imported. Import path: `/Users/Shared/My DAZ 3D Library/People/Genesis 9/Characters/RawArt/Dainir/Parts/Raw Dainir Goatee.duf`

## DAZ Library Layout

```
/Users/Shared/My DAZ 3D Library/
├── People/Genesis 9/Characters/RawArt/Dainir/
│   ├── Raw Dainir Male CHR.duf          # Male character preset
│   ├── Raw Dainir Female CHR.duf        # Female character preset
│   ├── Materials/
│   │   ├── Raw Dainir 01 Male MAT.duf   # Full skin material (M)
│   │   ├── Raw Dainir 01 Female MAT.duf # Full skin material (F)
│   │   ├── Raw Dainir 02 Face Male.duf  # Face variant
│   │   ├── Raw Dainir 02 Face Female.duf
│   │   ├── Raw Dainir 02 Face Paint.duf
│   │   ├── Raw Dainir 02 Makeup Golden.duf
│   │   ├── Raw Dainir 02 Makeup Pink.duf
│   │   ├── Raw Dainir 03 Eyes Blue.duf  # 7 eye color presets
│   │   ├── Raw Dainir 03 Eyes Brown/Green/Orange/Pink/Violet/Yellow.duf
│   │   ├── Raw Dainir 04 Beard Dark.duf # 3 beard colors
│   │   ├── Raw Dainir 04 Beard Light/Red.duf
│   │   └── Raw Dainir 05 Fur Brown.duf  # 3 fur colors
│   │       Raw Dainir 05 Fur Dark/Light.duf
│   └── Parts/
│       ├── Raw Dainir All Parts.duf
│       ├── Raw Dainir Antler.duf
│       ├── Raw Dainir Goatee.duf         # ← MISSING from base files
│       ├── Raw Dainir Hoof Fur.duf
│       ├── Raw Dainir Hooves.duf
│       └── Raw Dainir Leg Fur.duf
└── Runtime/Textures/RawArt/G9Dainir/
    ├── G9Dainir_Body_TM.jpg / NM / SM / TrluM  # Male body
    ├── G9Dainir_Body_TF.jpg / NF / SF / TrluF  # Female body
    ├── G9Dainir_Head_TM.jpg / NM / SM / TrluM  # Male head
    ├── G9Dainir_Arms_T.jpg / N / S / Trlu       # Arms (shared)
    ├── G9Dainir_Legs_T.jpg / N / S / Trlu       # Legs (shared)
    ├── G9Dainir_Gen-m_T.jpg / N / S / Trlu      # Male genitalia
    ├── G9Dainir_Gen-f_T.jpg / N / S / Trlu      # Female genitalia
    ├── G9Dainir_Antler_T.jpg / N / S / Trlu
    ├── G9Dainir_Hooves_T.jpg / N / S / Trlu
    ├── G9Dainir_Nails_T.jpg / N / S / Trlu
    ├── G9Dainir_Eyes_T.jpg (+ T2-T7 for variants)
    ├── Raw Dainir Goatee/
    │   ├── G9Dainir_Goatee-T.jpg (+ T2, T3)
    │   └── Head Raw Dainir Goatee.png
    ├── Raw Dainir Leg Fur/
    │   ├── G9Dainir_Body_TFur.jpg
    │   ├── G9Dainir_Legs_TFur.jpg
    │   ├── Body Raw Dainir Leg Fur.png
    │   └── Legs Raw Dainir Leg Fur.png
    └── Raw Dainir Hoof Fur/
        └── Hooves Raw Dainir Hoof Fur.png
```

## Body Morphs Available (43 custom shape keys on male base)

### Body Shape
| Morph | Effect | Range |
|-------|--------|-------|
| Body Older | Aged body proportions, skin sag | -1 to 1 |
| Body Thin | Overall thinness | -1 to 1 |
| Body Emaciated | Extreme thinness, visible ribs | -1 to 1 |
| Body Heavy | Overall heaviness | -1 to 1 |
| Body Muscular Mass | Muscle bulk | -1 to 1 |
| Body Muscular Details | Muscle definition | -1 to 1 |
| Body Tone | Muscle tone/fitness | -1 to 1 |
| Body Lithe | Slim athletic build | -1 to 1 |
| Body Fitness Mass | Fitness-oriented bulk | -1 to 1 |
| Body Fitness Details | Fitness definition | -1 to 1 |

### Masculine
| Body Stocky | Short stocky build | -1 to 1 |
| Body Portly | Portly/heavy set | -1 to 1 |

### Feminine
| Body Voluptuous | Feminine curves | -1 to 1 |
| Body Pear Figure | Pear-shaped figure | -1 to 1 |

### Regional
| Mass Body / Neck / Shoulders / Upper Torso / Lower Torso | Regional mass | -1 to 1 |
| Love Handles | Hip fat | -1 to 1 |
| Pregnant | Pregnancy belly | 0 to 1 |
| Stomach Soften / Depth | Stomach shape | -1 to 1 |
| Ribcage Size | Ribcage width | -1 to 1 |
| Traps / Lats / Calves / Glute / Hip / Scapula Size | Individual muscles | -1 to 1 |
| Collarbone Detail | Visible collarbones | -1 to 1 |

### Proportion
| Proportion Height / Legs Length / Torso Length | Overall proportions | -1 to 1 |
| Chest Width / Depth, Shoulder Width | Frame proportions | -1 to 1 |
| Arms / Fingers / Foot / Toes Length | Extremity proportions | -1 to 1 |
| Larger / Smaller | Uniform scale | -1 to 1 |

## Critical Bug: Shape Key Accumulation

**`shape_key_add()` initializes vertex positions from the CURRENT EVALUATED mesh, not from Basis.** If any shape key has value > 0 when creating a new one, the new shape key will inherit phantom vertex offsets.

**Fix:** Always set `value = 0.0` on each shape key after creation, AND copy all vertex positions from Basis before applying deltas:

```python
new_sk = mesh_obj.shape_key_add(name=label)
new_sk.value = 0.0
new_sk.slider_min = -1.0

# CRITICAL: Copy ALL vertex positions from Basis first
basis = sk_blocks.key_blocks['Basis']
for i in range(len(mesh_obj.data.vertices)):
    new_sk.data[i].co.x = basis.data[i].co.x
    new_sk.data[i].co.y = basis.data[i].co.y
    new_sk.data[i].co.z = basis.data[i].co.z

# THEN apply deltas (DAZ Y-up cm → Blender Z-up m)
for vidx, (dx, dy, dz) in deltas.items():
    if vidx < num_verts:
        new_sk.data[vidx].co.x += dx * 0.01
        new_sk.data[vidx].co.y += dz * 0.01  # DAZ Z → Blender Y
        new_sk.data[vidx].co.z += dy * 0.01  # DAZ Y → Blender Z
```

## Genital UV Fix

DAZ anatomy geografts use UDIM tile 1002 (U: 1.0-2.0). Blender's non-UDIM workflows need UVs in tile 1001 (U: 0.0-1.0).

**Fix:** Copy UVs from secondary layer with -1.0 U offset:

```python
main_uv = mesh_data.uv_layers['Base Multi UDIM']
anat_uv = mesh_data.uv_layers['Default UVs:Genesis 9 Anatomical Elements Male Mesh']

for poly in mesh_data.polygons:
    if poly.material_index == genitalia_material_index:
        for loop_idx in poly.loop_indices:
            src_u, src_v = anat_uv.data[loop_idx].uv
            if abs(src_u) > 0.001 or abs(src_v) > 0.001:
                main_uv.data[loop_idx].uv = (src_u - 1.0, src_v)
```

## Pipeline Steps (Per Boss)

### 1. Start from Base Template
```
Open dainir-male-base.blend (or female base)
Save As: boss-{name}.blend
```

### 2. Apply Body Morphs
Set shape key values to create the boss's distinctive body shape. Each boss has a unique morph recipe.

### 3. Bake Morphs into Vertices
```python
# Apply the morph mix as the new Basis
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
```

### 4. Apply Skin Coloring
Insert HSV + MixRGB nodes between each material's diffuse texture and its BSDF input to tint the skin per boss's circle theme.

**Materials that need coloring:** Head, Body, Arms, Legs, Genitalia

### 5. Fur Overlay
- Get fur positions from Leg Fur + Hoof Fur meshes
- Build proximity mask (faces within 3cm of fur geometry)
- Blend aged/colored fur tint onto atlas at those UV positions
- Hide fur meshes after overlay

### 6. Join Meshes
```python
# Select body + antlers + hooves (NOT fur meshes)
# Join into single mesh
bpy.ops.object.join()
```

### 7. Create Atlas UV
```python
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.002)
```

### 8. Bake Diffuse Atlas
- Add BakeTarget image node (2048x2048) to all materials
- Connect AtlasUV node to BakeTarget's Vector input
- Bake type: DIFFUSE, pass_filter: COLOR
- This requires adding a light to the scene first

**Known issue:** Cycles bake with Selected-to-Active fails silently if materials use DAZ Dual Lobe PBR group. Self-bake also fails. Workaround: programmatic pixel blending for fur overlay.

### 9. Fill Atlas Margins
Iterative dilation (16 passes) to fill black pixels between UV islands. Prevents seam bleeding in the game engine.

### 10. Brightness Correction
Atlas often too dark after aging tint. Multiply by 1.4-1.6 and add warm offset.

### 11. Consolidate for Export
- Replace all material slots with single atlas material
- Remove extra UV layers (keep only Atlas, rename to UVMap)
- Remove fur meshes from scene
- Rename mesh to boss name

### 12. Export GLB
```python
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_image_format='JPEG',
)
```

### 13. Save .blend
Save the pre-export .blend with packed textures for future editing.

---

## Boss Morph Recipes

### 1. Il Vecchio (Limbo — Ignorance) ✅ COMPLETE
- **Base:** Male
- **Character:** Ancient patriarch, gatekeeper. Thin, old, weathered.
- **Morphs:** BodyOlder=1.0, BodyThin=0.6, BodyEmaciated=0.2, BodyTone=-0.3, BodyMuscularMass=-0.2, ProportionHeight=0.15, StomachSoften=0.5, MassNeck=0.2, TrapsSize=0.3, ScapulaSize=0.4, CollarboneDetail=0.6, LoveHandles=0.15
- **Skin:** HSV desaturation=0.5, ashy purple-grey tint (0.55, 0.52, 0.58) at 30%
- **Fur:** Aged grey-brown (0.35, 0.33, 0.31) at 40% blend
- **Goatee:** Chin tint (0.55, 0.53, 0.50) at 25%
- **Export:** 29,698v, 1.1MB GLB, 2048x2048 atlas

### 2. Caprone (Lust — Desire) ✅ COMPLETE
- **Base:** Female
- **Character:** Baphomet archetype, inherently dual-gendered
- **Morphs:** BodyVoluptuous=0.8, BodyTone=0.5, ProportionChestWidth=0.3, HipSize=0.4, ProportionShoulderWidth=0.3, BodyMuscularMass=0.3, BodyMuscularDetails=0.2, BodyFitnessDetails=0.3, GluteSize=0.3, MassUpperTorso=0.2, MassThighs=0.2, ProportionHeight=0.15, BodyPearFigure=0.2, ProportionLegsLength=0.1, LatsSize=0.2
- **Skin:** Warm deep crimson-red (r*1.15+0.08, g*0.85+0.03, b*0.70), passion marks 2%
- **Fur:** Dark crimson (0.45, 0.25, 0.2) at 40% blend
- **Export:** 30,764v, 2.0MB GLB, 2048x2048 atlas

### 3. Vorago (Gluttony — Excess) ✅ COMPLETE
- **Base:** Female
- **Character:** Grotesque mother, earth-devourer
- **Morphs:** BodyHeavy=1.0, Pregnant=0.8, BodyPortly=0.7, StomachSoften=1.0, LoveHandles=1.0, GluteSize=0.8, MassBody=0.5, MassLowerTorso=0.6, MassThighs=0.4, StomachDepth=0.5, StomachDepthLower=0.4, HipSize=0.5, BodyPearFigure=0.3, MassAnkles=0.2, BodyVoluptuous=0.3
- **Skin:** Sickly green-yellow (r*0.75+0.05, g*0.95+0.08, b*0.65), blotchy patches 5%
- **Fur:** Olive-brown (0.35, 0.3, 0.15) at 40% blend
- **Export:** 30,764v, 1.9MB GLB, 2048x2048 atlas

### 4. Aureo (Greed — Avarice) ✅ COMPLETE
- **Base:** Female
- **Character:** Vain adorned she-goat, Salome
- **Morphs:** BodyLithe=0.8, BodyTone=0.6, ProportionHeight=0.3, BodyVoluptuous=0.3, BodyFitnessDetails=0.4, CollarboneDetail=0.4, ProportionLegsLength=0.15, ProportionArmsLength=0.1, ProportionShoulderWidth=0.15, MassNeck=-0.1, ScapulaSize=0.2, BodyPearFigure=0.15
- **Skin:** Golden/bronze (r*1.1+0.1, g*1.0+0.06, b*0.6), golden shimmer 3%
- **Fur:** Warm gold-brown (0.55, 0.4, 0.2) at 40% blend
- **Export:** 30,764v, 1.8MB GLB, 2048x2048 atlas

### 5. Furia (Wrath — Rage) ✅ COMPLETE
- **Base:** Male
- **Character:** Hyper-masculine, maximum rage
- **Morphs:** BodyMuscularMass=1.0, BodyMuscularDetails=1.0, BodyStocky=0.5, MassShoulders=0.8, MassUpperTorso=0.8, TrapsSize=1.0, LatsSize=0.8, MassNeck=0.7, ProportionHeight=0.2, ProportionShoulderWidth=0.4, ProportionChestWidth=0.3, ProportionChestDepth=0.2, MassBody=0.3, MassThighs=0.3, CalvesSize=0.3
- **Skin:** Deep crimson/blood red (r*1.2+0.1, g*0.65, b*0.5), blood veins 4%
- **Fur:** Dark crimson (0.4, 0.2, 0.15) at 40% blend
- **Export:** 29,698v, 2.2MB GLB, 2048x2048 atlas

### 6. Profano (Heresy — Defiance) ✅ COMPLETE
- **Base:** Female
- **Character:** Witch, heretical priestess
- **Morphs:** BodyThin=0.5, BodyLithe=0.6, BodyOlder=0.4, ProportionHeight=0.2, BodyEmaciated=0.15, CollarboneDetail=0.6, ScapulaSize=0.3, MassNeck=-0.2, ProportionArmsLength=0.1, BodyTone=0.3, ProportionFingersLength=0.1, RibcageSize=-0.1
- **Skin:** Pale grey-purple, corpse-like (55% desat, r*0.8+0.05, g*0.78, b*0.9+0.08), dark veins 3%
- **Fur:** Cold purple-grey (0.3, 0.28, 0.32) at 40% blend
- **Export:** 30,764v, 2.3MB GLB, 2048x2048 atlas

### 7. Il Macello (Violence — Bloodshed) ✅ COMPLETE
- **Base:** Male
- **Character:** Brute Minotaur, the Butcher
- **Morphs:** BodyHeavy=0.8, BodyMuscularMass=1.0, BodyStocky=1.0, MassBody=0.8, MassShoulders=1.0, MassUpperTorso=1.0, Larger=0.3, BodyMuscularDetails=0.6, TrapsSize=0.8, MassNeck=0.5, ProportionShoulderWidth=0.3, MassThighs=0.5, CalvesSize=0.3, LatsSize=0.6
- **Skin:** Dark blood-brown, scarred (r*0.7+0.08, g*0.55+0.02, b*0.45), scar marks 4%
- **Fur:** Dark brown (0.3, 0.2, 0.15) at 40% blend
- **Export:** 29,698v, 1.9MB GLB, 2048x2048 atlas

### 8. Inganno (Fraud — Deception) ✅ COMPLETE
- **Base:** Female
- **Character:** Beautiful deceiver, Geryon face
- **Morphs:** BodyVoluptuous=0.6, BodyTone=0.8, BodyFitnessDetails=0.5, ProportionHeight=0.2, BodyLithe=0.3, ProportionLegsLength=0.15, ProportionShoulderWidth=0.1, HipSize=0.2, GluteSize=0.15, ProportionChestWidth=0.15, BodyFitnessMass=0.2, CollarboneDetail=0.3
- **Skin:** Deceptively fair (r*0.9+0.12, g*0.9+0.1, b*0.9+0.08), dark undertone patches 4%
- **Fur:** Warm brown (0.4, 0.35, 0.3) at 40% blend
- **Export:** 30,764v, 2.5MB GLB, 2048x2048 atlas

### 9. Azazel (Treachery — Betrayal) ✅ COMPLETE
- **Base:** Male
- **Character:** The Scapegoat, fallen angel. Transcendent.
- **Morphs:** BodyThin=0.3, BodyTone=0.7, ProportionHeight=0.4, ProportionShoulderWidth=0.3, ProportionChestWidth=0.2, BodyOlder=0.15, BodyEmaciated=0.1, ProportionLegsLength=0.2, ProportionArmsLength=0.15, ProportionTorsoLength=0.1, ProportionFingersLength=0.1, CollarboneDetail=0.5, ScapulaSize=0.5, MassNeck=-0.15, MassForearms=-0.1
- **Skin:** Pale ice-blue, ethereal (60% desat, r*0.85+0.15, b*1.15+0.05), frost veining 3%
- **Fur:** Cold blue-grey (0.35, 0.38, 0.45) at 40% blend
- **Export:** 29,698v, 1.7MB GLB, 2048x2048 atlas

---

## Step 14: Auto Rigger Pro (ARP) Smart Rigging

> Added 2026-03-01. ARP Smart creates a production IK/FK rig with 339-348 bones per boss.

### Overview

Auto Rigger Pro (ARP) Smart is a Blender add-on that detects body landmarks on a mesh and creates a complete animation rig with IK/FK chains, roll bones, stretch bones, and facial controls. The process requires 6 anatomical markers placed on the mesh, then ARP's detection algorithm builds the full skeleton.

### Prerequisites

- **Auto Rigger Pro** installed in Blender (tested with Blender 5.0)
- **Dainir skeleton** present in each boss `.blend` file (used as ground truth for marker placement)
- **Blender MCP server** running (for programmatic control)

### The Problem: ARP in Non-GUI Context

ARP Smart was designed for interactive use in Blender's GUI viewport. Two functions deep in `auto_rig_smart.py` access `bpy.context.area.spaces` which is `None` when running through MCP or `--background` mode:

- `set_selection_filters()` (line ~7196) — sets viewport selection filter states
- `show_extras()` (line ~7213) — toggles viewport extra visibility

Both crash with `AttributeError: 'NoneType' object has no attribute 'spaces'`.

Additionally, `bpy.context.area` itself is `None` in MCP context, but ARP operators have a `poll()` method that requires a valid VIEW_3D area.

### The Solution: temp_override + Monkey Patching

**Discovery:** While `bpy.context.area` is None in MCP, a real VIEW_3D area EXISTS in `bpy.context.window_manager.windows`. Blender 3.2+ provides `bpy.context.temp_override()` to inject this area into operator calls.

**Two-part fix:**

1. **Monkey-patch** the GUI-dependent functions to no-ops (prevents crashes)
2. **Use `temp_override()`** to provide a valid area/space_data/region context (satisfies operator polls)

```python
# Part 1: Monkey-patch GUI functions
import auto_rig_pro.src.auto_rig_smart as arp_smart
arp_smart.set_selection_filters = lambda types, state: None
arp_smart.show_extras = lambda state: None

# Also patch auto_rig.py if it has the same functions
try:
    import auto_rig_pro.src.auto_rig as arp_main
    if hasattr(arp_main, 'set_selection_filters'):
        arp_main.set_selection_filters = lambda t, s: None
    if hasattr(arp_main, 'show_extras'):
        arp_main.show_extras = lambda s: None
except:
    pass

# Part 2: Find the real VIEW_3D area
def get_view3d():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                for region in area.regions:
                    if region.type == 'WINDOW':
                        return window, area, region
    return None, None, None

# Use it for operator calls
w, a, r = get_view3d()
with bpy.context.temp_override(window=w, area=a, region=r):
    bpy.ops.id.get_selected_objects()  # Now works!
    bpy.ops.id.go_detect()             # Now works!
```

**CRITICAL:** Patches must be re-applied after every `bpy.ops.wm.open_mainfile()` call, as opening a new file can clear module state.

### Marker Placement: Dainir Rig as Ground Truth

ARP Smart requires 6 marker empties placed at specific anatomical positions:

| Marker | Body Part | Used For |
|--------|-----------|----------|
| `root_loc` | Hip center | Spine root, leg attachment |
| `chin_loc` | Chin front | Head/jaw bone chain |
| `neck_loc` | Neck base | Neck bone chain |
| `shoulder_loc` | Left shoulder | Arm chain origin (mirrored) |
| `hand_loc` | Left hand | Arm chain terminus (mirrored) |
| `foot_loc` | Left foot | Leg chain terminus (mirrored) |

**Why NOT use mesh geometry estimation:** An initial approach estimated marker positions from the mesh bounding box (e.g., "hand is at X extremity, hip height"). This produced markers that were 5-18cm off from correct positions, resulting in rigs with arms extending past hands, spines off-center, and incorrect proportions. Every marker was wrong.

**Why Dainir rig works:** Each boss `.blend` file already contains the Dainir skeleton (DAZ Genesis 9, 313-325 bones) with exact anatomical bone positions. Reading these bone positions gives sub-millimeter accuracy.

```python
def markers_from_dainir(armature):
    """Extract ARP marker positions from Dainir rig bone positions."""
    wm = armature.matrix_world

    def get_pos(name):
        bone = armature.data.bones.get(name)
        if bone is None:
            bone = armature.data.bones.get(name + '.001')
        return (wm @ bone.head_local) if bone else None

    hip = get_pos('hip')
    l_upperarm = get_pos('l_upperarm')
    l_hand = get_pos('l_hand')
    l_foot = get_pos('l_foot')
    neck = get_pos('neck1')
    chin_bone = get_pos('chin')

    # Validate all required bones were found
    missing = [name for name, pos in [
        ('hip', hip), ('l_upperarm', l_upperarm), ('l_hand', l_hand),
        ('l_foot', l_foot), ('neck1', neck), ('chin', chin_bone),
    ] if pos is None]
    if missing:
        raise ValueError(f"Missing bones: {', '.join(missing)}")

    return {
        # Root: hip center, zeroed X for symmetry
        'root': (0.0, hip.y, hip.z),
        # Chin: chin bone position, zeroed X
        'chin': (0.0, chin_bone.y, chin_bone.z),
        # Neck: neck1 bone, zeroed X
        'neck': (0.0, neck.y, neck.z),
        # Shoulder: left upperarm at 85% X (slightly inward from joint)
        'shoulder': (l_upperarm.x * 0.85, l_upperarm.y, l_upperarm.z),
        # Hand: left hand bone, exact position
        'hand': (l_hand.x, l_hand.y, l_hand.z),
        # Foot: left foot bone, exact position
        'foot': (l_foot.x, l_foot.y, l_foot.z),
    }
```

**Marker accuracy comparison (Il Vecchio):**

| Marker | Mesh Estimate | Dainir Bone | Error |
|--------|--------------|-------------|-------|
| root | (0, -0.005, 0.866) | (0, -0.005, 0.959) | 9.3cm |
| chin | (0, 0.075, 1.543) | (0, -0.099, 1.495) | 18.1cm |
| neck | (0, 0.03, 1.488) | (0, 0.029, 1.403) | 8.5cm |
| shoulder | (0.064, 0.04, 1.379) | (0.139, 0.041, 1.343) | 8.3cm |
| hand | (0.623, -0.03, 0.866) | (0.523, -0.025, 0.993) | 16.4cm |
| foot | (0.145, 0.04, -0.031) | (0.110, 0.043, 0.075) | 11.4cm |

### Mesh Selection: The Fur Name Bug

When selecting the boss mesh for rigging, fur meshes must be excluded. A naive filter `'fur' not in name.lower()` fails because boss name **"Furia"** contains the substring "fur":

```python
# WRONG: 'fur' in 'furia'.lower() == True → excludes the boss mesh!
if 'fur' not in obj.name.lower():

# CORRECT: Check for actual fur mesh naming pattern (e.g. "Leg Fur", "Hoof Fur")
# but exclude boss names that contain "fur" (e.g. "Furia")
def is_fur_mesh(name):
    lower = name.lower()
    # Actual fur meshes are named like "Leg Fur", "Hoof Fur"
    fur_patterns = ['leg fur', 'hoof fur', 'fur mesh', 'fur_mesh']
    return any(p in lower for p in fur_patterns)
```

### ARP Configuration

```python
scn = bpy.context.scene
scn.arp_smart_type = 'BODY'        # Full body detection
scn.arp_fingers_enable = True       # Detect finger bones
scn.arp_fingers_to_detect = 5       # 5 fingers per hand
scn.arp_smart_overwrite = False     # Don't overwrite existing rigs
scn.arp_smart_sym = True            # Enforce bilateral symmetry
```

### Full Pipeline Function

The complete pipeline for rigging one boss:

```python
def arp_rig_boss(boss_name):
    import bpy, os
    from mathutils import Vector

    BOSS_DIR = "assets/models/bosses"
    blend_path = os.path.join(BOSS_DIR, f"boss-{boss_name}.blend")

    # 1. Open file
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    # 2. Enable ARP + apply patches
    bpy.ops.preferences.addon_enable(module='auto_rig_pro')
    patch_arp()  # Monkey-patch set_selection_filters + show_extras

    # 3. Clean any existing ARP artifacts
    for obj in list(bpy.data.objects):
        if any(x in obj.name.lower() for x in ['arp_', 'body_temp', 'marker']):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif obj.type == 'ARMATURE' and obj.name == 'rig':
            bpy.data.objects.remove(obj, do_unlink=True)

    # 4. Find boss mesh (excluding fur meshes)
    mesh_obj = None
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and not is_fur_mesh(obj.name) \
           and len(obj.data.vertices) > 20000:
            mesh_obj = obj
            break

    # 5. Find Dainir armature, extract marker positions
    dainir = bpy.data.objects.get('Dainir')
    markers = markers_from_dainir(dainir)

    # 6. Configure ARP
    scn = bpy.context.scene
    scn.arp_smart_type = 'BODY'
    scn.arp_fingers_enable = True
    scn.arp_fingers_to_detect = 5
    scn.arp_smart_overwrite = False
    scn.arp_smart_sym = True

    # 7. Select mesh
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj

    # 8. Step 1: Register selected mesh
    w, a, r = get_view3d()
    with bpy.context.temp_override(window=w, area=a, region=r):
        bpy.ops.id.get_selected_objects()

    # 9. Step 2: Place markers at Dainir bone positions
    with bpy.context.temp_override(window=w, area=a, region=r):
        for name, pos in markers.items():
            bpy.context.scene.cursor.location = Vector(pos)
            bpy.ops.id.add_marker(body_part=name)

    # 10. Step 3: Run detection (re-patch first!)
    patch_arp()
    with bpy.context.temp_override(window=w, area=a, region=r):
        bpy.ops.id.go_detect()

    # 11. Verify
    rig = bpy.data.objects.get('rig')
    bone_count = len(rig.data.bones) if rig else 0
    return bone_count
```

### ARP Results — All 9 Bosses

| # | Boss | Base | Dainir Bones | ARP Bones | Wrist Detection | Status |
|---|------|------|-------------|-----------|-----------------|--------|
| 1 | Il Vecchio | Male | 313 | 348 | OK | Full rig |
| 2 | Caprone | Female | 325 | 339 | Failed | No fingers |
| 3 | Vorago | Female | 325 | 348 | OK | Full rig |
| 4 | Aureo | Female | 325 | 339 | Failed | No fingers |
| 5 | Furia | Male | 313 | 348 | OK | Full rig |
| 6 | Profano | Female | 325 | 339 | Failed | No fingers |
| 7 | Il Macello | Male | 313 | 339 | Failed | No fingers |
| 8 | Inganno | Female | 325 | 339 | Failed | No fingers |
| 9 | Azazel | Male | 313 | 348 | OK | Full rig |

**348 bones** = full rig with finger bones (IK/FK arms, legs, spine, head, fingers)
**339 bones** = full rig minus finger bones (wrist detection failed — "Could not find wrist front, marker out of mesh")

The wrist detection failure occurs when the hand marker is slightly outside the mesh volume from ARP's perspective. The core rig (spine, arms, legs, head) is correct in all cases. Finger animation is not needed for this game (bosses use canned attack animations), so 339 bones is acceptable.

### What the ARP Rig Contains

The 348-bone rig includes:

- **Spine chain:** root → spine_01 → spine_02 → spine_03 → neck → head
- **Arm chains (L/R):** shoulder → upperarm → forearm → hand (IK + FK)
  - IK pole targets for elbow direction
  - Stretch bones for squash-and-stretch
  - Roll bones (twist_01, twist_02) for natural forearm rotation
- **Finger chains (L/R, 5 each):** thumb/index/middle/ring/pinky × 3 joints
- **Leg chains (L/R):** thigh → shin → foot → toe (IK + FK)
  - IK pole targets for knee direction
  - Heel/toe roll controls
  - Stretch bones
- **Face controls:** jaw, eye targets
- **Special bones:** c_root_master (global transform), c_traj (trajectory)

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `AttributeError: 'NoneType' has no attribute 'spaces'` | ARP accesses `bpy.context.area.spaces` | Monkey-patch `set_selection_filters` and `show_extras` |
| `RuntimeError: Operator bpy.ops.id.* poll() failed` | No VIEW_3D area in context | Use `bpy.context.temp_override(window=w, area=a, region=r)` |
| 0 bones created | Mesh excluded by name filter | Check `is_fur_mesh()` isn't matching boss name |
| 339 instead of 348 bones | Wrist detection failed | Hand marker slightly outside mesh; core rig still correct |
| Patches lost after file open | `open_mainfile()` clears module state | Re-call `patch_arp()` after every file open |
| `ARP_OT_guess_markers` fails | Requires AI inference binaries not installed | Use manual markers from Dainir rig instead |

---

## Known Issues & Gaps

1. ~~**Goatee mesh never imported**~~ — **RESOLVED.** Goatee chin tint painted onto male boss atlas textures via programmatic pixel blending.
2. ~~**Female base missing body morphs**~~ — **RESOLVED.** 53 body morphs imported from DAZ DSF files into dainir-female-base.blend (now 159 total shape keys).
3. ~~**Cycles bake fails with DAZ materials**~~ — **RESOLVED.** Workaround: replace DAZ materials with simple Principled BSDF + texture before baking. Works reliably in batch mode.
4. **Atlas seams visible** — Smart UV Project creates many small islands. Manual UV unwrap would fix but is time-intensive.
5. ~~**Auto Rigger Pro**~~ — **RESOLVED.** ARP Smart rigging completed on all 9 bosses via Blender MCP with temp_override context injection. See "Step 14" above.
6. **Hair strand meshes have no UVs** — Fur/goatee dHair meshes use hair shader, not image textures. Must assign solid colors or generate UVs for baking.
7. **Blender MCP crashes on UV operations** — Smart UV Project and other compute-heavy operations crash Blender when run through MCP socket. Workaround: run all pipeline operations in `--background` batch mode with `--python` flag.
8. **ARP wrist detection fails on some bosses** — 5 of 9 bosses get 339 bones instead of 348 (missing finger bones). Root cause: hand marker position relative to mesh volume. Not a blocker — game doesn't need finger animation.

---

## File Outputs Per Boss

| File | Purpose | Size |
|------|---------|------|
| `boss-{name}.blend` | Editable Blender file with packed textures | ~3-5 MB |
| `boss-{name}.glb` | Game-ready mesh with Draco compression | 1.1-2.5 MB |
| `{name}-diffuse.jpg` | Atlas texture (also embedded in GLB) | ~700 KB - 1.7 MB |

## Summary Table — All 9 Bosses

| # | Boss | Circle | Sin | Base | Vertices | GLB Size | ARP Bones |
|---|------|--------|-----|------|----------|----------|-----------|
| 1 | Il Vecchio | 1 | Limbo | Male | 29,698 | 1.1 MB | 348 |
| 2 | Caprone | 2 | Lust | Female | 30,764 | 2.0 MB | 339 |
| 3 | Vorago | 3 | Gluttony | Female | 30,764 | 1.9 MB | 348 |
| 4 | Aureo | 4 | Greed | Female | 30,764 | 1.8 MB | 339 |
| 5 | Furia | 5 | Wrath | Male | 29,698 | 2.2 MB | 348 |
| 6 | Profano | 6 | Heresy | Female | 30,764 | 2.3 MB | 339 |
| 7 | Il Macello | 7 | Violence | Male | 29,698 | 1.9 MB | 339 |
| 8 | Inganno | 8 | Fraud | Female | 30,764 | 2.5 MB | 339 |
| 9 | Azazel | 9 | Treachery | Male | 29,698 | 1.7 MB | 348 |

**Total asset budget:** 18.4 MB across 9 bosses (avg 2.0 MB each)
**Rig bones:** 348 (full rig with fingers) or 339 (without fingers due to wrist detection)
