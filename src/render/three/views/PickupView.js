import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';

const crateGeometry = new THREE.OctahedronGeometry(9, 0);
const ringGeometry = new THREE.TorusGeometry(14, 1.1, 6, 28);
const materials = new Map();
const materialsFor = color => {
  if (!materials.has(color)) {
    const c = new THREE.Color(color);
    materials.set(color, {
      crate: new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, flatShading: true, transparent: true }),
      ring: new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(2.5), transparent: true, opacity: 0.85 }),
    });
  }
  return materials.get(color);
};

// A spinning glowing gem in the weapon's colour inside a ring; it bobs and
// blinks faster and faster as it is about to vanish.
export class PickupView {
  constructor(pickup) {
    const m = materialsFor(pickup.color);
    this.object = new THREE.Group();
    this.crate = new THREE.Mesh(crateGeometry, m.crate);
    this.ring = new THREE.Mesh(ringGeometry, m.ring);
    this.object.add(this.crate, this.ring);
  }

  update(p, { t, bounds }) {
    this.object.position.set(toSceneX(bounds, p.x), toSceneY(bounds, p.y), 8 + Math.sin(p.age * 3) * 3);
    this.crate.rotation.set(p.age * 1.3, p.age * 2.1, 0);
    this.ring.rotation.set(Math.sin(p.age * 1.7) * 0.6, Math.cos(p.age * 1.3) * 0.6, 0);
    const pop = Math.min(1, p.age * 4);       // grows in when dropped
    this.object.scale.setScalar(pop * (1 + Math.sin(t * 6) * 0.06));
    // in the last 30 % of its life it blinks, quicker towards the end
    const left = p.remaining;
    this.object.visible = left > 0.3 || Math.sin(p.age * (30 - left * 60)) > -0.2;
  }
}
