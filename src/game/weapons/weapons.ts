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
    damage: 3,
    pellets: 1,
    spread: 0,
    magSize: 8,
    fireRate: 300,
    reloadTime: 1500,
    range: 50,
    isProjectile: false,
  },
  brimShotgun: {
    id: 'brimShotgun',
    name: 'Brimstone Shotgun',
    damage: 2,
    pellets: 6,
    spread: 0.12,
    magSize: 4,
    fireRate: 800,
    reloadTime: 2000,
    range: 15,
    isProjectile: false,
  },
  hellfireCannon: {
    id: 'hellfireCannon',
    name: 'Hellfire Cannon',
    damage: 2,
    pellets: 1,
    spread: 0.02,
    magSize: 40,
    fireRate: 80,
    reloadTime: 3000,
    range: 30,
    isProjectile: true,
    projectileSpeed: 0.5,
  },
  goatsBane: {
    id: 'goatsBane',
    name: "Goat's Bane",
    damage: 50,
    pellets: 1,
    spread: 0,
    magSize: 3,
    fireRate: 2000,
    reloadTime: 4000,
    range: 100,
    isProjectile: true,
    projectileSpeed: 0.3,
    aoe: 5,
  },
};
