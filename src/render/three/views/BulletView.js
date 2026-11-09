import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';

// Model space matches the ships: the rocket points along +x.
const alongX = g => g.rotateZ(-Math.PI / 2);
const bodyGeometry = alongX(new THREE.CylinderGeometry(0.9, 0.9, 7, 8)).translate(-1, 0, 0);
const noseGeometry = alongX(new THREE.ConeGeometry(0.9, 2.6, 8)).translate(3.8, 0, 0);
const finGeometry = new THREE.BoxGeometry(2.2, 3.6, 0.25).translate(-3.6, 0, 0);
const flameGeometry = new THREE.ConeGeometry(0.85, 1, 8).rotateZ(Math.PI / 2).translate(-0.5, 0, 0);

const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.6, roughness: 0.35, flatShading: true });
const flameMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xffb347).multiplyScalar(3), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
});
const tipMaterials = new Map();
const tipMaterialFor = color => {
  if (!tipMaterials.has(color)) {
    const c = new THREE.Color(color);
    tipMaterials.set(color, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, flatShading: true }));
  }
  return tipMaterials.get(color);
};

// A small rocket in the shooter's colour, aligned with its flight direction.
export class BulletView {
  constructor(bullet) {
    const tip = tipMaterialFor(bullet.owner.color);
    this.object = new THREE.Group();
    this.object.scale.setScalar(1.4);
    this.object.rotation.order = 'ZYX'; // yaw to the heading, then spin about the rocket's own axis
    this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
    this.flame.position.x = -4.5;
    const fins = [0, Math.PI / 2].map(r => {
      const fin = new THREE.Mesh(finGeometry, tip);
      fin.rotation.x = r;
      return fin;
    });
    this.object.add(new THREE.Mesh(bodyGeometry, bodyMaterial), new THREE.Mesh(noseGeometry, tip), ...fins, this.flame);
  }

  update(b, { t, bounds }) {
    this.object.position.set(toSceneX(bounds, b.x), toSceneY(bounds, b.y), 4);
    // Game y points down, scene y points up, so the heading flips sign.
    this.object.rotation.set(t * 12, 0, Math.atan2(-b.vy, b.vx));
    this.flame.scale.set(6 + Math.random() * 5, 1, 1);
  }
}
