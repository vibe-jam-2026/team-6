import * as THREE from 'three';
import { TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';

const TURRETS = 6;
const WHITE = new THREE.Color(0xffffff);

// The boss: a glowing faceted core inside a spinning armour ring with turrets.
// It grows in while warping in, flashes white when hit and pulses faster when enraged.
export class BossView {
  constructor(boss) {
    const r = boss.radius;
    const baseColor = new THREE.Color(boss.color);
    this.baseColor = baseColor;
    this.object = new THREE.Group();

    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x401018, emissive: baseColor, emissiveIntensity: 0.8, roughness: 0.4, metalness: 0.3, flatShading: true,
    });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.55, 1), this.coreMaterial);
    this.core.castShadow = true;

    this.armorMaterial = new THREE.MeshStandardMaterial({ color: 0x5a6070, roughness: 0.55, metalness: 0.7, flatShading: true });
    this.ring = new THREE.Group();
    this.ring.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, r * 0.13, 8, 32), this.armorMaterial));
    const turretGeometry = new THREE.BoxGeometry(r * 0.28, r * 0.2, r * 0.3);
    for (let i = 0; i < TURRETS; i++) {
      const a = i * TAU / TURRETS;
      const t = new THREE.Mesh(turretGeometry, this.armorMaterial);
      t.position.set(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, 0);
      t.rotation.z = a;
      this.ring.add(t);
    }
    this.ring.children.forEach(c => { c.castShadow = true; });

    this.haloMaterial = new THREE.MeshBasicMaterial({ color: baseColor.clone().multiplyScalar(2.5), transparent: true, opacity: 0.6 });
    this.halo = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 1.6, 6, 48), this.haloMaterial);

    this.object.add(this.core, this.ring, this.halo);
    this.turretGeometry = turretGeometry;
  }

  update(boss, { t, bounds }) {
    const scale = boss.entering ? Math.max(0.05, boss.entryProgress ** 2) : 1;
    this.object.scale.setScalar(scale);
    this.object.position.set(toSceneX(bounds, boss.x), toSceneY(bounds, boss.y), 12 + Math.sin(t * 1.5) * 4);
    this.object.rotation.z = boss.entering ? t * 6 : 0;

    this.ring.rotation.z = -boss.angle;
    this.core.rotation.set(t * 0.7, t * 0.5, 0);
    const pulse = boss.enraged ? 0.5 + 0.5 * Math.sin(t * 14) : 0.5 + 0.5 * Math.sin(t * 4);
    this.coreMaterial.emissive.copy(boss.flash > 0 ? WHITE : this.baseColor);
    this.coreMaterial.emissiveIntensity = boss.flash > 0 ? 2.5 : 0.6 + pulse * (boss.enraged ? 1.4 : 0.6);
    this.haloMaterial.opacity = boss.entering ? 0.9 : 0.25 + boss.health * 0.5;
  }

  dispose() {
    this.core.geometry.dispose();
    this.ring.children[0].geometry.dispose();
    this.turretGeometry.dispose();
    this.halo.geometry.dispose();
    this.coreMaterial.dispose();
    this.armorMaterial.dispose();
    this.haloMaterial.dispose();
  }
}
