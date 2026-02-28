# Domain 6: Polish

> Quality-of-life improvements and sensory refinements.

## 6.1 Replace Procedural Audio Stings

**Files:** `src/game/systems/AudioSystem.ts`

13 sounds are still procedural Web Audio synthesis while the rest of the game uses file-based OGG. The procedural sounds are noticeably thinner and more "programmer art" than the Kenney SFX library.

| Sound | Current | Replacement approach |
|-------|---------|---------------------|
| `goat_die` | Sawtooth oscillator descending | Source a death grunt/squeal OGG |
| `goat_alert` | Sawtooth oscillator ascending | Source an alert/aggro bark OGG |
| `pickup` | Triangle oscillator ascending | Source a coin/pickup chime OGG |
| `hurt` | Noise burst | Source an impact/grunt OGG |
| `empty` | Click oscillator | Source a dry-fire click OGG |
| `reload` | Filtered noise sweep | Source a magazine-insert OGG |
| `reload_complete` | High ping | Source a bolt-rack OGG |
| `weapon_switch` | Metallic click | Source a weapon-swap OGG |
| `headshot` | Low thud + high ping | Could keep procedural (distinctive) |
| `death_sting` | Descending minor chord | Keep procedural (rare, effective) |
| `victory_sting` | Ascending major chord | Keep procedural (rare, effective) |
| `boss_defeat` | Power chord | Keep procedural (rare, effective) |
| `game_complete` | Extended fanfare | Keep procedural (rare, effective) |

**Priority replacements:** `goat_die`, `goat_alert`, `pickup`, `hurt` — these play constantly and are most noticeable.

**Acceptance:** Common gameplay sounds use OGG files. Rare stings can stay procedural.

## 6.2 Door Close Sound

**Files:** `src/game/systems/DoorSystem.ts`, `src/game/systems/AudioSystem.ts`

The `doorClose` OGGs are loaded but never played. Doors should play a close sound when they shut.

**Tasks:**
1. Add `'doorClose'` SoundType to AudioSystem
2. Route `'doorClose'` to the `sfx-doorClose` buffer group
3. Call `playSound('doorClose')` in DoorSystem when door closes (or after a delay from open)

**Acceptance:** Opening a door plays open sound, door closing plays close sound.

## 6.3 Hellfire Cannon Sound (see also Bug Fix 2.1)

If Bug Fix 2.1 is resolved with pitch-shifting, this becomes a polish item to revisit later with proper SFX.

## 6.4 Mobile Testing & Touch Polish

**Files:** `src/game/ui/TouchControls.ts`, `src/game/GameEngine.tsx`

Touch controls exist but haven't been tested on real devices.

**Tasks:**
1. Test on iOS Safari and Android Chrome
2. Verify virtual joystick responsiveness and dead zone
3. Verify fire button and reload button placement
4. Check if weapon switch buttons are reachable
5. Test pause button
6. Audit for any `pointerLock` calls that would fail on mobile

**Acceptance:** Game playable on mobile browser with touch-only input.

## 6.5 Performance Profiling

**Files:** All rendering systems

**Tasks:**
1. Profile in Chrome DevTools Performance tab during a 10-enemy arena
2. Identify frame-time spikes (target: 60fps on mid-range hardware)
3. Common suspects:
   - Gore decal DynamicTexture creation (creates a new texture per decal)
   - Minimap Canvas 2D redraw (every 100ms, full clear + redraw)
   - Particle systems (many simultaneous emitters during explosions)
   - Entity iteration in game loop (multiple `world.entities.filter()` per frame)
4. Optimize the top 3 bottlenecks

**Acceptance:** Sustained 60fps during arena wave 5 on a 2020-era laptop.

## 6.6 Visual Improvements

Low-priority visual polish ideas:

- **Screen-space ambient occlusion (SSAO)** — Babylon.js has built-in SSAO2. Would add depth to dungeon corners.
- **Volumetric lighting** — God rays from fire baskets through dungeon corridors
- **Enemy death ragdoll** — Replace instant disappearance with a brief mesh collapse animation
- **Weapon idle sway** — Already implemented (WeaponViewModel.ts), verify it feels natural
- **Muzzle flash** — Brief point light at weapon tip on fire (currently no visual flash)

## 6.7 Accessibility

- **Colorblind mode** — Alternative color scheme for health/ammo/damage indicators
- **Screen reader** — Not applicable for an FPS, but ensure UI text is readable at small sizes
- **Remappable controls** — Allow key rebinding from settings menu
- **Subtitle for boss taunts** — Already shown on BossIntroScreen, verify readability
