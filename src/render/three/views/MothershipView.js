import * as THREE from 'three';
import { TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';

const LIGHTS = 16;
const WHITE = new THREE.Color(0xffffff);

// The final boss: a wide saucer-shaped carrier with a glowing command dome, a
// ring of running lights, a dark hangar mouth on the open side and a shimmering
// shield arc that sweeps around it. Grows in while warping in, flashes on hits.
export class MothershipView {
  constructor(boss) {
    const r = boss.radius;
    const base = new THREE.Color(boss.color);
    this.base = base;
    this.object = new THREE.Group();
    this.disposables = [];
    const keep = x => (this.disposables.push(x), x);

    // hull: a lathed saucer profile (rim thick, edges tapering)
    const profile = [[0, -0.16], [0.55, -0.2], [0.95, -0.06], [1, 0], [0.95, 0.07], [0.6, 0.16], [0.3, 0.2], [0, 0.2]]
      .map(([x, y]) => new THREE.Vector2(x * r, y * r));
    this.hullMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x3a3550, metalness: 0.75, roughness: 0.4, flatShading: true }));
    const hull = new THREE.Mesh(keep(new THREE.LatheGeometry(profile, 24).rotateX(Math.PI / 2)), this.hullMaterial);
    hull.castShadow = true;

    // command dome
    this.domeMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x2a1040, emissive: base, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.2 }));
    const dome = new THREE.Mesh(keep(new THREE.SphereGeometry(r * 0.32, 20, 10, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2)), this.domeMaterial);
    dome.position.z = r * 0.18;

    // armour plates on top, spinning slowly
    this.plates = new THREE.Group();
    const plateGeometry = keep(new THREE.BoxGeometry(r * 0.3, r * 0.1, r * 0.06));
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8, p = new THREE.Mesh(plateGeometry, this.hullMaterial);
      p.position.set(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.14);
      p.rotation.z = a + Math.PI / 2;
      p.castShadow = true;
      this.plates.add(p);
    }

    // running lights round the rim
    this.lightMaterial = keep(new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(3) }));
    this.lights = new THREE.Group();
    const lightGeometry = keep(new THREE.SphereGeometry(r * 0.035, 6, 4));
    for (let i = 0; i < LIGHTS; i++) {
      const a = i * TAU / LIGHTS, l = new THREE.Mesh(lightGeometry, this.lightMaterial);
      l.position.set(Math.cos(a) * r * 0.99, Math.sin(a) * r * 0.99, 0);
      this.lights.add(l);
    }

    // the shield arc and, opposite it, the hangar mouth (both turn with shieldAngle)
    this.shieldMaterial = keep(new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x7ae8ff).multiplyScalar(2), transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    const arc = boss.shieldArc;
    this.shield = new THREE.Group();
    const band = new THREE.Mesh(keep(new THREE.TorusGeometry(r * 1.12, r * 0.05, 6, 40, arc).rotateZ(-arc / 2)), this.shieldMaterial);
    const wall = new THREE.Mesh(keep(new THREE.CylinderGeometry(r * 1.12, r * 1.12, r * 0.4, 40, 1, true, Math.PI / 2 - arc / 2, arc)
      .rotateX(Math.PI / 2)), this.shieldMaterial);
    const hangar = new THREE.Mesh(keep(new THREE.BoxGeometry(r * 0.22, r * 0.5, r * 0.12)),
      keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a4a).multiplyScalar(1.6) })));
    hangar.position.set(-r * 0.93, 0, 0);
    this.shield.add(band, wall, hangar);

    this.object.add(hull, dome, this.plates, this.lights, this.shield);
  }

  update(boss, { t, bounds }) {
    const scale = boss.entering ? Math.max(0.05, boss.entryProgress ** 2) : 1;
    this.object.scale.setScalar(scale);
    this.object.position.set(toSceneX(bounds, boss.x), toSceneY(bounds, boss.y), 16 + Math.sin(t * 1.1) * 4);
    this.object.rotation.z = boss.entering ? t * 3 : 0;
    // game angles run clockwise on screen (y down); scene angles counter-clockwise
    this.shield.rotation.z = -boss.shieldAngle;
    this.plates.rotation.z = -boss.angle;
    this.lights.rotation.z = t * 0.6;
    const blink = Math.sin(t * (boss.enraged ? 18 : 6)) > 0;
    this.lightMaterial.color.copy(boss.enraged && blink ? WHITE : this.base).multiplyScalar(3);
    this.domeMaterial.emissive.copy(boss.flash > 0 ? WHITE : this.base);
    this.domeMaterial.emissiveIntensity = boss.flash > 0 ? 2.6 : 0.7 + (boss.enraged ? 0.6 + 0.6 * Math.sin(t * 12) : 0.3 * Math.sin(t * 3));
    this.shieldMaterial.opacity = boss.entering ? 0.15 : boss.shieldFlash > 0 ? 0.9 : 0.35 + 0.1 * Math.sin(t * 9);
  }

  dispose() { this.disposables.forEach(d => d.dispose()); }
}
