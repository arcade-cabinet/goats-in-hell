// Mock for @babylonjs/core — provides minimal stubs for unit tests

export class Vector3 {
  constructor(public x = 0, public y = 0, public z = 0) {}

  static Distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static Dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(other: Vector3) {
    return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector3) {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  scale(factor: number) {
    return new Vector3(this.x * factor, this.y * factor, this.z * factor);
  }

  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z) || 1;
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }
}

export class Scene {}
export class ParticleSystem {
  dispose() {}
}
export class AbstractMesh {
  dispose() {}
}
export class Mesh extends AbstractMesh {
  metadata: any = {};
}
export class MeshBuilder {
  static CreateBox() {
    return new Mesh();
  }
  static CreateSphere() {
    return new Mesh();
  }
  static CreateGround() {
    return new Mesh();
  }
  static CreateTorus() {
    return new Mesh();
  }
}
export class StandardMaterial {
  constructor() {}
}
export class Color3 {
  constructor(public r = 0, public g = 0, public b = 0) {}
}
export class Color4 {
  constructor(public r = 0, public g = 0, public b = 0, public a = 1) {}
}
export class UniversalCamera {}
