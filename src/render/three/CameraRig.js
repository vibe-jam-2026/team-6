import * as THREE from 'three';
import { EVENTS } from '../../core/EventBus.js';
import { rand } from '../../core/math.js';

const TILT = 0.48;          // radians from straight down
const SHAKE_DECAY = 30;     // units per second

// Positions the tilted camera so the whole arena fits on screen, adds menu drift
// and explosion shake, and maps screen pixels back onto the arena plane.
export class CameraRig {
  #base = new THREE.Vector3();
  #target = new THREE.Vector3();
  #shake = 0;
  #raycaster = new THREE.Raycaster();

  constructor(camera, bus) {
    this.camera = camera;
    bus.on(EVENTS.SHIP_DESTROYED, () => { this.#shake = 10; });
    bus.on(EVENTS.SELF_DESTRUCT, () => { this.#shake = 45; });
    bus.on(EVENTS.BOSS_DESTROYED, () => { this.#shake = 28; });
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid }) => { this.#shake = Math.max(this.#shake, asteroid.size * 2); });
  }

  resetShake() { this.#shake = 0; }

  fit(viewport) {
    const { width: w, height: h } = viewport;
    const cam = this.camera;
    this.viewport = viewport;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const v = new THREE.Vector3();
    let ty = 0, d = 1000;
    const place = dist => {
      cam.position.set(0, ty - dist * Math.sin(TILT), dist * Math.cos(TILT));
      cam.lookAt(0, ty, 0);
      cam.updateMatrixWorld();
    };
    const extent = () => {
      let mx = 0, top = -Infinity, bot = Infinity;
      for (const c of corners) {
        v.copy(c).project(cam);
        mx = Math.max(mx, Math.abs(v.x)); top = Math.max(top, v.y); bot = Math.min(bot, v.y);
      }
      return { mx, top, bot };
    };
    // binary-search the distance that fits, then re-centre vertically; repeat to converge
    for (let it = 0; it < 8; it++) {
      let lo = 50, hi = 50000;
      for (let i = 0; i < 40; i++) {
        d = (lo + hi) / 2; place(d);
        const e = extent();
        if (e.mx <= 0.96 && e.top <= 0.86 && e.bot >= -0.9) hi = d; else lo = d;
      }
      d = hi; place(d);
      const e = extent();
      ty += ((e.top + e.bot) / 2 + 0.02) * h * 0.35;
    }
    place(d);
    this.#base.copy(cam.position);
    this.#target.set(0, ty, 0);
  }

  update(dt, t, { drift = false } = {}) {
    const cam = this.camera;
    this.#shake = Math.max(0, this.#shake - dt * SHAKE_DECAY);
    cam.position.copy(this.#base);
    if (drift) { cam.position.x += Math.sin(t * 0.25) * 60; cam.position.y += Math.cos(t * 0.2) * 30; }
    if (this.#shake > 0) {
      cam.position.x += rand(-this.#shake, this.#shake) * 1.5;
      cam.position.y += rand(-this.#shake, this.#shake) * 1.5;
    }
    cam.lookAt(this.#target);
    cam.updateMatrixWorld();
  }

  // screen pixel -> point on the horizontal plane at the given height
  screenToPlane(px, py, height = 0) {
    const { width: w, height: h } = this.viewport;
    this.#raycaster.setFromCamera(new THREE.Vector2((px / w) * 2 - 1, -(py / h) * 2 + 1), this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -height);
    return this.#raycaster.ray.intersectPlane(plane, new THREE.Vector3()) || new THREE.Vector3();
  }
}
