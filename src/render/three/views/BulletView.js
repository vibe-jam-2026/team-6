import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';
import { alongX } from '../geometry.js';

// Model space matches the ships: the rocket points along +x.
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

const orbGeometry = new THREE.SphereGeometry(3, 12, 10);
const orbMaterials = new Map();
const orbMaterialFor = color => {
  if (!orbMaterials.has(color)) orbMaterials.set(color, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) }));
  return orbMaterials.get(color);
};

const pipGeometry = new THREE.SphereGeometry(1, 8, 6);
const FLASH = new THREE.Color(0xffffff).multiplyScalar(4);
const OVERHEAT = new THREE.Color(0xff5a1f).multiplyScalar(3);   // what a shell glows as it nears bursting

// The Mothership's heavy shell: a big orb with a pip circling it for every shot it
// can still take. Each hit flashes it white, shakes it, knocks off a pip,
// shrinks it and turns it hotter orange, so it visibly cracks up before it bursts.
class ArmouredShellView {
  constructor(bullet) {
    this.base = new THREE.Color(bullet.owner.color).multiplyScalar(3);
    this.coreMaterial = new THREE.MeshBasicMaterial({ color: this.base.clone() });
    this.size = bullet.radius / 3 * 1.6;
    this.object = new THREE.Group();
    this.core = new THREE.Mesh(orbGeometry, this.coreMaterial);
    this.object.add(this.core);
    this.pips = Array.from({ length: bullet.maxHp }, () => {
      const pip = new THREE.Mesh(pipGeometry, orbMaterialFor(bullet.owner.color));
      this.object.add(pip);
      return pip;
    });
  }

  update(b, { t, bounds }) {
    const shake = b.hitFlash * 3;
    this.object.position.set(toSceneX(bounds, b.x) + (Math.random() - 0.5) * shake, toSceneY(bounds, b.y) + (Math.random() - 0.5) * shake, 4);
    // shrinks to half size and shifts to an angry orange as it takes damage
    // (flickering on its last hit point), swells and flashes white for a moment when hit
    const damage = 1 - b.health, last = b.hp === 1;
    const flicker = last ? 0.85 + 0.15 * Math.sin(t * 40) : 1;
    this.core.scale.setScalar(this.size * (1 - 0.5 * damage) * (1 + b.hitFlash * 0.5) * flicker);
    this.coreMaterial.color.copy(this.base).lerp(OVERHEAT, Math.min(1, damage * 1.3)).lerp(FLASH, b.hitFlash);
    const r = this.size * 3 * (1 - 0.3 * damage) + 6, spin = t * 4;
    this.pips.forEach((pip, i) => {
      pip.visible = i < b.hp;
      const a = spin + (i / this.pips.length) * Math.PI * 2;
      pip.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      pip.scale.setScalar(3.2);
    });
  }

  dispose() { this.coreMaterial.dispose(); }
}

// A small rocket in the shooter's colour, aligned with its flight direction.
export class BulletView {
  constructor(bullet) {
    if (bullet.hostile && bullet.armoured) {
      this.shell = new ArmouredShellView(bullet);
      this.object = this.shell.object;
      return;
    }
    if (bullet.hostile) {
      // the boss fires glowing energy orbs instead of rockets
      this.object = new THREE.Mesh(orbGeometry, orbMaterialFor(bullet.owner.color));
      this.object.scale.setScalar(bullet.radius / 3 * 1.6);
      return;
    }
    const tip = tipMaterialFor(bullet.owner.color);
    this.object = new THREE.Group();
    this.object.scale.setScalar(1.4 * (bullet.weapon?.size ?? 1));
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

  update(b, frame) {
    if (this.shell) return this.shell.update(b, frame);
    const { t, bounds } = frame;
    this.object.position.set(toSceneX(bounds, b.x), toSceneY(bounds, b.y), 4);
    if (b.hostile) return;
    // Game y points down, scene y points up, so the heading flips sign.
    this.object.rotation.set(t * 12, 0, Math.atan2(-b.vy, b.vx));
    this.flame.scale.set(6 + Math.random() * 5, 1, 1);
  }

  dispose() { this.shell?.dispose(); }
}
