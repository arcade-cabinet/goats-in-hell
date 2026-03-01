---
title: "DAZ to Blender to Game Pipeline Reference"
status: implemented
created: "2026-02-28"
updated: "2026-03-01"
domain: pipelines
pipeline_type: asset-import
tools:
  - DAZ Studio
  - Blender 4.x+
  - Diffeomorphic DAZ Importer
  - glTF/GLB export
related:
  - docs/boss-pipeline.md
  - docs/GAME-BIBLE.md
---

# DAZ → Blender → Game Pipeline Reference

> Technical reference for importing Dainir (Genesis 9) characters into Blender
> via Diffeomorphic DAZ Importer and exporting game-ready GLBs.

---

## Prerequisites

- **Blender 4.x+** with Diffeomorphic DAZ Importer (`bl_ext.user_default.import_daz`)
- **DAZ Content Library** at `/Users/Shared/My DAZ 3D Library`
- **Dainir for Genesis 9** (RawArt) — installed via DIM or manual unzip
- **Genesis 9 Anatomical Elements** (Male/Female) — free with Genesis 9

### Diffeomorphic Configuration

```python
addon = bpy.context.preferences.addons.get("bl_ext.user_default.import_daz")
prefs = addon.preferences
# Content directory must be set
# Settings file: /Users/jbogaty/DAZ Importer/import_daz_settings.json
# Contains: {"contentDirs": ["/Users/Shared/My DAZ 3D Library"]}
bpy.ops.daz.load_settings_file(filepath="/Users/jbogaty/DAZ Importer/import_daz_settings.json")
```

---

## Dainir Character Overview

| Property | Value |
|----------|-------|
| Product | Dainir for Genesis 9 (RawArt, #108257) |
| Rig | Genesis 9 (231 bones base) |
| Base Verts | ~25,182 |
| Shape Keys | 105+ (body, JCM, masculine, feminine) |
| Materials | 7 base (Fingernails, Toenails, Legs, Mouth Cavity, Arms, Head, Body) |
| Parts | Antlers (1,776v), Hooves (1,430v), Leg Fur (24,775v), Hoof Fur (4,164v), Goatee (hair) |
| Textures | Body, Head, Arms, Legs, Nails, Mouth, Eyes, Antler, Hooves, Genital (M/F) |

### File Locations

```
/Users/Shared/My DAZ 3D Library/
├── People/Genesis 9/Characters/
│   ├── Raw Dainir Male CHR.duf          # Male character preset (shape + base mats)
│   ├── Raw Dainir Female CHR.duf        # Female character preset
│   └── RawArt/Dainir/
│       ├── Materials/
│       │   ├── Raw Dainir 01 Male MAT.duf   # Full material preset (24 materials!)
│       │   ├── Raw Dainir 01 Female MAT.duf
│       │   ├── Raw Dainir 02 Face *.duf     # Face paint variants
│       │   ├── Raw Dainir 03 Eyes *.duf     # Eye color variants
│       │   ├── Raw Dainir 04 Beard *.duf    # Beard color variants
│       │   └── Raw Dainir 05 Fur *.duf      # Fur color variants
│       └── Parts/
│           ├── Raw Dainir All Parts.duf     # Loads antlers+hooves+fur+goatee
│           └── Raw Dainir [part].duf        # Individual parts
├── People/Genesis 9/Anatomy/
│   ├── Genesis 9 Anatomical Elements Male.duf
│   └── Genesis 9 Anatomical Elements Female.duf
└── Runtime/Textures/RawArt/G9Dainir/
    ├── G9Dainir_Body_T{M,F}.jpg         # Body diffuse (male/female)
    ├── G9Dainir_Body_N{M,F}.jpg         # Body normal
    ├── G9Dainir_Body_S{M,F}.jpg         # Body specular
    ├── G9Dainir_Body_Trlu{M,F}.jpg      # Body translucency
    ├── G9Dainir_Gen-m_{T,N,S,Trlu}.jpg  # Male genital textures
    ├── G9Dainir_Gen-f_{T,N,S,Trlu}.jpg  # Female genital textures
    ├── G9Dainir_Head_*.jpg              # Head variants
    ├── G9Dainir_Arms_*.jpg              # Arms
    ├── G9Dainir_Legs_*.jpg              # Legs
    ├── G9Dainir_Antler_*.jpg            # Antler
    ├── G9Dainir_Hooves_*.jpg            # Hooves
    ├── G9Dainir-Microdetail_Rough.jpg   # Shared micro-detail normal
    └── G9Dainir_Nails_*.jpg             # Nails
```

---

## MAT DUF Structure (Critical Finding)

The `Raw Dainir 01 Male MAT.duf` file contains **24 material definitions** — not just body
materials, but also genital materials, part materials, and hair materials. Key structure:

```
DUF format: plain JSON (not gzip compressed)
├── scene.materials[] — 24 material definitions with group/geometry targets
├── scene.animations[] — 11,850 property value entries (textures, colors, weights)
└── scene.modifiers[] — simulation settings
```

### Genitalia Material Properties (from MAT DUF)

The MAT preset configures genital materials with **identical PBR values** to the body:

| Property | Body | Male Genitalia | Female Genitalia |
|----------|------|----------------|------------------|
| Translucency Weight | 0.8 | 0.8 | 0.8 |
| SSS Color | [0.976, 0.922, 0.929] | [0.976, 0.922, 0.929] | [0.976, 0.922, 0.929] |
| Transmitted Color | [0.976, 0.902, 0.878] | [0.976, 0.902, 0.878] | [0.976, 0.902, 0.878] |
| Specular Lobe 1 Roughness | 0.4 | 0.4 | 0.4 |
| Dual Lobe Roughness Mult | 0.5 | 0.5 | 0.5 |
| Specular Lobe 2 Roughness | 0.4 | 0.4 | 0.4 |
| Top Coat Roughness | 0.672 | 0.672 | 0.672 |
| Normal Map Strength | 1.0 | 1.0 | 1.0 |
| Detail Normal Map | Microdetail_Rough | Microdetail_Rough | Microdetail_Rough |

**The only difference is the texture maps.** The genital textures are painted to match
the body textures at seam boundaries. Same shader = seamless skin.

### Texture Mapping per Material

| Material | Diffuse (T) | Normal (N) | Specular (S) | Translucency (Trlu) |
|----------|------------|------------|--------------|---------------------|
| Body (M) | Body_TM | Body_NM | Body_SM | Body_TrluM |
| Body (F) | Body_TF | Body_NF | Body_SF | Body_TrluF |
| Gen Male | Gen-m_T | Gen-m_N | Gen-m_S | Gen-m_Trlu |
| Gen Female | Gen-f_T | Gen-f_N | Gen-f_S | Gen-f_Trlu |
| Head | Head_T | Head_N | Head_S | Head_Trlu |
| Arms | Arms_T | Arms_N | Arms_S | Arms_Trlu |
| Legs | Legs_T | Legs_N | Legs_S | Legs_Trlu |

---

## Correct Import Pipeline

### Order of Operations

This order is critical for seamless results:

1. **Import Dainir CHR** — loads shape + base materials
2. **Import Anatomy** — adds genital mesh as separate object
3. **Merge Geograft** — welds anatomy into body mesh at border vertices
4. **Import All Parts** — adds antlers, hooves, fur
5. **Apply Dainir MAT preset** — configures ALL materials (body + genitals + parts)
6. **Fix Genital UVs** — copy from secondary UV layer to main UDIM layer

### Step 1: Import Character

```python
from bl_ext.user_default import import_daz

CHR_PATH = ".../Raw Dainir Male CHR.duf"  # or Female
import_daz.set_selection([CHR_PATH])
bpy.ops.daz.easy_import_daz(
    fitMeshes='DBZFILE',
    useMergeGeografts=False,
    useBody=True, useJcms=True,
    useMasculine=True, useFeminine=True
)
```

Result: Armature (231 bones) + Mesh (25,182 verts, 7 materials, 105 shape keys)

### Step 2: Import Anatomy

```python
ANATOMY_PATH = ".../Genesis 9 Anatomical Elements Male.duf"  # or Female
import_daz.set_selection([ANATOMY_PATH])
bpy.ops.daz.easy_import_daz(...)
```

Result: Separate armature (21 bones male / 12 bones female) + mesh (1,516v male / 1,066v female)

### Step 3: Merge Geograft

**Critical**: The BODY mesh must be the **active** object, and the anatomy mesh must be **selected**.

```python
bpy.ops.object.select_all(action='DESELECT')
body_mesh.select_set(True)
anatomy_mesh.select_set(True)
bpy.context.view_layer.objects.active = body_mesh  # NOT the armature!

bpy.ops.daz.merge_geografts()
```

Result: Anatomy vertices welded into body at border seam. ~50 border vertices merged.
Body gains new material slot "Genitalia-1".

**Known issue**: If merging BOTH male and female anatomy on the same body (for hermaphroditic
Caprone boss), the second merge will fail because the first merge modified the border vertices.
Workaround: Use `bpy.ops.object.join()` for the second anatomy instead of merge_geografts.

After merge, join the orphan anatomy armature into the main armature:
```python
bpy.ops.object.select_all(action='DESELECT')
anatomy_armature.select_set(True)
main_armature.select_set(True)
bpy.context.view_layer.objects.active = main_armature
bpy.ops.object.join()
```

### Step 4: Import Parts

```python
ALL_PARTS_PATH = ".../Raw Dainir All Parts.duf"
import_daz.set_selection([ALL_PARTS_PATH])
bpy.ops.daz.easy_import_daz(...)
```

Result: 5 additional meshes (Antlers, Hooves, Leg Fur, Hoof Fur, Goatee) parented to armature.

### Step 5: Apply MAT Preset (THE KEY STEP)

**This is what makes genitals seamless.** The MAT DUF sets up ALL 24 materials including
genitals with matching PBR properties.

If applying via Diffeomorphic works:
```python
MAT_PATH = ".../Raw Dainir 01 Male MAT.duf"
import_daz.set_selection([MAT_PATH])
bpy.ops.daz.import_daz_materials()  # or re-run easy_import_daz
```

If Diffeomorphic material application fails (common in background mode), use the
**manual fix**: duplicate the Body material, swap textures to genital versions.

### Step 5 (Manual Fix): Clone Body Material for Genitals

```python
body_mat = mesh.data.materials[6]  # "Body"
gen_mat = body_mat.copy()  # Copies node tree automatically
gen_mat.name = "Genitalia"

# Texture suffix is M for male base, F for female base
# Male base: Body_TM, Body_NM, Body_SM, Body_TrluM
# Female base: Body_TF, Body_NF, Body_SF, Body_TrluF
TEX_DIR = "/Users/Shared/My DAZ 3D Library/Runtime/Textures/RawArt/G9Dainir"

# Swap name mapping: body image name -> (genital path, colorspace)
# Use Gen-m for male genitalia, Gen-f for female genitalia
swaps = {
    'G9Dainir_Body_TM': (f'{TEX_DIR}/G9Dainir_Gen-m_T.jpg', 'sRGB'),
    'G9Dainir_Body_NM': (f'{TEX_DIR}/G9Dainir_Gen-m_N.jpg', 'Non-Color'),
    'G9Dainir_Body_SM': (f'{TEX_DIR}/G9Dainir_Gen-m_S.jpg', 'Non-Color'),
}

tree = gen_mat.node_tree
for node in tree.nodes:
    if node.type == 'TEX_IMAGE' and node.image:
        for body_name, (gen_path, cs) in swaps.items():
            if node.image.name == body_name:
                gen_img_name = gen_path.split('/')[-1]
                if gen_img_name in bpy.data.images:
                    node.image = bpy.data.images[gen_img_name]
                else:
                    node.image = bpy.data.images.load(gen_path)
                node.image.colorspace_settings.name = cs
                break

# Clone the translucency group (must be independent from Body's)
for node in tree.nodes:
    if node.type == 'GROUP' and node.node_tree and 'Trlu' in node.node_tree.name:
        new_group = node.node_tree.copy()
        new_group.name = "DIMG G9Dainir_Gen-m_Trlu"
        node.node_tree = new_group
        for gnode in new_group.nodes:
            if gnode.type == 'TEX_IMAGE' and gnode.image:
                trlu_path = f'{TEX_DIR}/G9Dainir_Gen-m_Trlu.jpg'
                trlu_name = trlu_path.split('/')[-1]
                if trlu_name in bpy.data.images:
                    gnode.image = bpy.data.images[trlu_name]
                else:
                    gnode.image = bpy.data.images.load(trlu_path)
                gnode.image.colorspace_settings.name = 'Non-Color'
        break

# Replace old bare-bones genital material with the clone
mesh.data.materials[7] = gen_mat
```

### Step 6: Fix Genital UVs

After geograft merge, genital UVs on the main "Base Multi UDIM" layer may be zeroed out.
Valid UVs exist on secondary layers with a +1.0 U offset (UDIM tile 1002).

```python
mesh_data = mesh.data
main_uv = mesh_data.uv_layers['Base Multi UDIM']
# For male anatomy: look for "Default UVs:Genesis 9 Anatomical Elements Male Mesh"
# For female anatomy: look for "Default UVs"

# Copy from secondary layer to main, shifting U by -1.0 for UDIM offset
for poly in mesh_data.polygons:
    if poly.material_index == genitalia_slot_index:
        for loop_idx in poly.loop_indices:
            src = secondary_uv.data[loop_idx].uv
            if abs(src[0]) > 0.001 or abs(src[1]) > 0.001:
                main_uv.data[loop_idx].uv[0] = src[0] - 1.0 if src[0] > 0.9 else src[0]
                main_uv.data[loop_idx].uv[1] = src[1]
```

---

## Blender Node Graph Structure

The Diffeomorphic importer creates this node graph for each PBR Skin material:

```
Diffuse Texture → Mix.001[A]
Translucency Group → Mix.001[B]
Mix.001 → Principled BSDF[Base Color]

Normal Texture → Mix[A]
Microdetail Group → Mix[B]
Mix → Normal Map → Principled BSDF[Normal]

Specular Texture → Math.001 (MULTIPLY) → DAZ Dual Lobe PBR[Roughness 1]
                 → Math.002 (MULTIPLY) → DAZ Dual Lobe PBR[Roughness 2]
                 → Math.003 (MULTIPLY) → DAZ Dual Lobe PBR[Fac]

Principled BSDF → DAZ Dual Lobe PBR[BSDF]
Normal Map → DAZ Dual Lobe PBR[Normal]
DAZ Dual Lobe PBR → Material Output[Surface]
```

Key Principled BSDF settings:
- Subsurface Weight: 0.8
- Subsurface Radius: [1.0, 0.84, 0.79]
- Subsurface Scale: 0.0047
- Subsurface IOR: 1.4
- Coat Roughness: 0.03

**The genital material must use this same graph structure.** A bare-bones
texture → BSDF → output setup will NOT match, because:
- Missing translucency map (Mix.001) changes color
- Missing dual lobe specular changes surface quality
- Missing subsurface scattering changes skin depth

---

## Game Export Pipeline

Target: ~8,000-10,000 verts per boss (current raw is ~60K with hair).

1. **Strip hair strand meshes** — Leg Fur (24,775v), Hoof Fur (4,164v), Goatee are
   hair strands. Remove them; bake fur texture into body texture instead.
2. **Apply DAZ morphs** — Set boss-specific body shape (musculature, proportions)
3. **Add/remove anatomy** — Per boss requirements (see GAME-BIBLE.md boss table)
4. **Add armor/props** — Circle-specific visual elements
5. **Decimate** — Target 8,000-10,000 verts total
6. **Bake texture atlas** — Single material, all textures baked through node graphs
   (this is where the seamless genital rendering happens regardless of node complexity)
7. **Export GLB** — GLTF format with Draco compression

```python
bpy.ops.export_scene.gltf(
    filepath="boss-name.glb",
    export_format='GLB',
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply_modifiers=True,
    export_animations=True
)
```

---

## Boss Base Templates

| Template | File | Verts | Bones | Materials | Anatomy |
|----------|------|-------|-------|-----------|---------|
| Male Base | `dainir-male-base.blend` | 26,492 body | 231+ | 8 (all full PBR, incl. Genitalia) | Male |
| Female Base | `dainir-female-base.blend` | 27,558 body | 231+ | 9 (all full PBR, incl. Genitalia Male + Female) | Both (herm.) |

### Boss → Template Mapping

| Boss | Circle | Template | Anatomy Needed |
|------|--------|----------|----------------|
| Il Vecchio | 1 Limbo | Male Base | Remove anatomy |
| Caprone | 2 Lust | Female Base | Both (hermaphroditic) |
| Vorago | 3 Gluttony | Female Base | Female only |
| Aureo | 4 Greed | Female Base | Remove anatomy |
| Furia | 5 Wrath | Male Base | Exaggerated male |
| Profano | 6 Heresy | Female Base | Female only |
| Il Macello | 7 Violence | Male Base | Exaggerated male |
| Inganno | 8 Fraud | Female Base | Female only |
| Azazel | 9 Treachery | Male Base | Remove anatomy |

---

## Troubleshooting

### merge_geografts fails with "context is incorrect"
**Cause**: Armature is active instead of mesh.
**Fix**: Set body mesh as active object, select anatomy mesh, then call merge_geografts.

### merge_geografts fails with "No matching mesh found for geograft"
**Cause**: Border vertices already modified by a previous merge.
**Fix**: Use `bpy.ops.object.join()` instead for the second anatomy.

### Genital UVs appear as black
**Cause**: Main UV layer has (0,0) for genital vertices after merge.
**Fix**: Copy from secondary UV layer with UDIM offset correction.

### Genital skin color doesn't match body
**Cause**: Body material uses complex node graph (Mix + Group + SSS), genitals have simple setup.
**Fix**: Duplicate Body material, swap textures. Or apply MAT preset after merge.

### easy_import_daz fails silently ("loaded in 0.001 seconds")
**Cause**: Content directories not loaded, or settings file not found.
**Fix**: Call `bpy.ops.daz.load_settings_file(filepath=...)` before import.

### Blender crashes in background mode during DAZ import
**Cause**: DAZ Importer needs OpenGL context for some operations.
**Fix**: Use Blender MCP server (interactive mode) instead of `--background --python`.
