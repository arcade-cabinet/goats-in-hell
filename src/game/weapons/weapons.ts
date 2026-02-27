import type {WeaponId} from '../entities/components';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  damage: number;
  pellets: number; // 1 for single, 6 for shotgun
  spread: number; // radians
  magSize: number;
  fireRate: number; // ms between shots
  reloadTime: number; // ms
  range: number;
  isProjectile: boolean; // true = spawns entity, false = hitscan
  projectileSpeed?: number;
  aoe?: number; // area of effect radius
}

export const weapons: Record<WeaponId, WeaponDef> = {
  hellPistol: {
    id: 'hellPistol',
    name: 'Hell Pistol',
    damage: 4,           // reliable hitscan, ~13 DPS
    pellets: 1,
    spread: 0,
    magSize: 12,
    fireRate: 300,
    reloadTime: 1200,
    range: 50,
    isProjectile: false,
  },
  brimShotgun: {
    id: 'brimShotgun',
    name: 'Brimstone Shotgun',
    damage: 4,           // 4×7 = 28 per shot at point-blank, ~23 DPS
    pellets: 7,
    spread: 0.14,
    magSize: 6,
    fireRate: 700,
    reloadTime: 2200,
    range: 12,
    isProjectile: false,
  },
  hellfireCannon: {
    id: 'hellfireCannon',
    name: 'Hellfire Cannon',
    damage: 3,           // rapid projectile stream, ~20 DPS
    pellets: 1,
    spread: 0.03,
    magSize: 30,
    fireRate: 150,
    reloadTime: 3000,
    range: 30,
    isProjectile: true,
    projectileSpeed: 0.5,
  },
  goatsBane: {
    id: 'goatsBane',
    name: "Goat's Bane",
    damage: 60,          // heavy rocket, ~40 DPS + AoE crowd clear
    pellets: 1,
    spread: 0,
    magSize: 3,
    fireRate: 1500,
    reloadTime: 3500,
    range: 100,
    isProjectile: true,
    projectileSpeed: 0.35,
    aoe: 5,
  },
};
