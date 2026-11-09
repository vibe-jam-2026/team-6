import * as THREE from 'three';
import { EVENTS } from '../../core/EventBus.js';
import { toSceneX, toSceneY } from './coords.js';

const DURATION = 1.4; // seconds

const ease = k => 1 - (1 - k) ** 3;
const easeRing = k => 1 - (1 - k) ** 1.6;
const glow = (color, boost) => new THREE.MeshBasicMaterial({
  color: new THREE.Color(color).multiplyScalar(boost), transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});

// The self-destruct blast in 3D: a white-hot fireball, two shockwave rings
// that sweep the whole arena, and a burst of light. Purely visual.
export class BlastView {
  #pending = [];
  #blasts = [];

  constructor(scene, bus) {
    this.scene = scene;
    this.ringGeometry = new THREE.RingGeometry(0.965, 1, 160);
    this.ballGeometry = new THREE.SphereGeometry(1, 32, 16);
    bus.on(EVENTS.SELF_DESTRUCT, ({ ship, x, y }) => this.#pending.push({ color: ship.color, x, y }));
  }

  update(t, bounds) {
    for (const p of this.#pending) this.#blasts.push(this.#create(p, t, bounds));
    this.#pending = [];
    const reach = Math.hypot(bounds.width, bounds.height);
    this.#blasts = this.#blasts.filter(b => {
      const k = (t - b.start) / DURATION;
      if (k >= 1 || k < 0) { this.#dispose(b); return k < 0; }
      const fade = 1 - k;
      const ballK = Math.min(1, k / 0.35);
      b.ball.scale.setScalar(20 + ease(ballK) * 230);
      b.ball.material.opacity = (1 - ballK) ** 1.5;
      b.ring.scale.setScalar(10 + easeRing(Math.min(1, k / 0.9)) * reach);
      b.ring.material.opacity = 0.9 * fade * fade;
      const k2 = Math.max(0, (k - 0.08) / 0.8);
      b.ring2.scale.setScalar(10 + easeRing(Math.min(1, k2)) * reach * 0.8);
      b.ring2.material.opacity = k2 > 0 ? fade * fade * 0.6 : 0;
      b.light.intensity = 6e6 * (1 - Math.min(1, k / 0.5)) ** 2;
      return true;
    });
  }

  #create({ color, x, y }, t, bounds) {
    const group = new THREE.Group();
    group.position.set(toSceneX(bounds, x), toSceneY(bounds, y), 6);
    const ball = new THREE.Mesh(this.ballGeometry, glow('#fff1c4', 3));
    const ring = new THREE.Mesh(this.ringGeometry, glow('#ffd28a', 2));
    const ring2 = new THREE.Mesh(this.ringGeometry, glow(color, 1.6));
    const light = new THREE.PointLight('#ffb36b', 0, 0, 2);
    light.position.z = 120;
    group.add(ball, ring, ring2, light);
    this.scene.add(group);
    return { start: t, group, ball, ring, ring2, light };
  }

  #dispose(b) {
    this.scene.remove(b.group);
    [b.ball, b.ring, b.ring2].forEach(m => m.material.dispose());
    b.light.dispose();
  }
}
