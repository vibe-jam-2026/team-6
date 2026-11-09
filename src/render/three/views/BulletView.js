import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';

const geometry = new THREE.SphereGeometry(3, 10, 8);
const materials = new Map();
const materialFor = color => {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) }));
  return materials.get(color);
};

export class BulletView {
  constructor(bullet) {
    this.object = new THREE.Mesh(geometry, materialFor(bullet.owner.color));
  }

  update(b, { bounds }) {
    this.object.position.set(toSceneX(bounds, b.x), toSceneY(bounds, b.y), 4);
  }
}
