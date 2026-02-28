/**
 * Vec3 utility functions — engine-agnostic replacements for Babylon Vector3 methods.
 */
import type {Vec3} from './components';

/** Create a new Vec3. */
export function vec3(x: number, y: number, z: number): Vec3 {
  return {x, y, z};
}

/** Create a zeroed Vec3. */
export function vec3Zero(): Vec3 {
  return {x: 0, y: 0, z: 0};
}

/** Clone a Vec3. */
export function vec3Clone(v: Vec3): Vec3 {
  return {x: v.x, y: v.y, z: v.z};
}

/** Euclidean distance between two Vec3 points. */
export function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Subtract b from a, returning a new Vec3. */
export function vec3Subtract(a: Vec3, b: Vec3): Vec3 {
  return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
}

/** Add two Vec3, returning a new Vec3. */
export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z};
}

/** Scale a Vec3 by a scalar, returning a new Vec3. */
export function vec3Scale(v: Vec3, s: number): Vec3 {
  return {x: v.x * s, y: v.y * s, z: v.z * s};
}

/** Length of a Vec3. */
export function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Normalize a Vec3, returning a new Vec3. Returns zero vector if length is ~0. */
export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len < 0.0001) return vec3Zero();
  return {x: v.x / len, y: v.y / len, z: v.z / len};
}

/** Scale a Vec3 in place (mutating). */
export function vec3ScaleInPlace(v: Vec3, s: number): Vec3 {
  v.x *= s;
  v.y *= s;
  v.z *= s;
  return v;
}

/** Add b to a in place (mutating). */
export function vec3AddInPlace(a: Vec3, b: Vec3): Vec3 {
  a.x += b.x;
  a.y += b.y;
  a.z += b.z;
  return a;
}
