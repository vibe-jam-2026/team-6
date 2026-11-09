import * as THREE from 'three';
import { EVENTS } from '../../core/EventBus.js';
import { rand } from '../../core/math.js';
import { CAMERA_SPIN } from '../../config.js';

const TILT = 0.48;          // radians from straight down (the default view)
const SHAKE_DECAY = 30;     // units per second
const UP = new THREE.Vector3(0, 0, 1);

const smooth = k => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;

// Positions the tilted camera so the whole arena fits on screen, adds menu drift,
// explosion shake and random swings to new angles during play, and maps screen
// pixels back onto the arena plane.
export class CameraRig {
  #shake = 0;
  #raycaster = new THREE.Raycaster();
  #home = null;     // the default view, fitted to the window
  #from = null;     // the view a swing starts from
  #to = null;       // the view it heads for
  #view = null;     // the current (blended) view
  #blend = 1;       // 0..1 progress of the current swing
  #timer = 0;       // seconds until the next swing
  #target = new THREE.Vector3();

  constructor(camera, bus) {
    this.camera = camera;
    bus.on(EVENTS.SHIP_DESTROYED, () => { this.#shake = 10; });
    bus.on(EVENTS.SELF_DESTRUCT, () => { this.#shake = 45; });
    bus.on(EVENTS.BOSS_DESTROYED, () => { this.#shake = 28; });
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid }) => { this.#shake = Math.max(this.#shake, asteroid.size * 2); });
  }

  resetShake() { this.#shake = 0; }

  // distance from the camera to the point it looks at (the scenery fades its fog by it)
  get distance() { return this.#view ? this.#view.d : this.camera.position.length(); }

  fit(viewport) {
    const cam = this.camera;
    this.viewport = viewport;
    cam.aspect = viewport.width / viewport.height;
    cam.updateProjectionMatrix();
    this.#home = this.#solve(0, TILT);
    // refit wherever we are heading so the arena stays on screen after a resize
    this.#to = this.#to ? this.#solve(this.#to.yaw, this.#to.tilt) : this.#home;
    this.#from = this.#view = this.#to;
    this.#blend = 1;
    this.#timer = rand(...CAMERA_SPIN.interval);
    this.#place(this.#view);
  }

  // spin: swing to random angles now and then; otherwise ease back to the default view
  update(dt, t, { drift = false, spin = false, frozen = false } = {}) {
    if (!this.#view) return;
    const cam = this.camera;
    if (!frozen) this.#steer(dt, spin);
    this.#shake = Math.max(0, this.#shake - dt * SHAKE_DECAY);
    this.#place(this.#view);
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

  #steer(dt, spin) {
    if (spin) {
      this.#timer -= dt;
      if (this.#timer <= 0) {
        this.#timer = rand(...CAMERA_SPIN.interval);
        this.#swingTo(this.#solve(rand(-CAMERA_SPIN.yaw, CAMERA_SPIN.yaw), rand(...CAMERA_SPIN.tilt)));
      }
    } else if (this.#to !== this.#home) {
      this.#timer = rand(...CAMERA_SPIN.interval);
      this.#swingTo(this.#home);
    }
    if (this.#blend < 1) {
      this.#blend = Math.min(1, this.#blend + dt / CAMERA_SPIN.duration);
      const k = smooth(this.#blend), a = this.#from, b = this.#to;
      this.#view = {
        yaw: lerp(a.yaw, b.yaw, k), tilt: lerp(a.tilt, b.tilt, k),
        d: lerp(a.d, b.d, k), tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k),
      };
    }
  }

  #swingTo(view) {
    this.#from = this.#view;
    this.#to = view;
    this.#blend = 0;
  }

  // put the camera at a view: yaw/tilt angles, distance d, look-at offset (tx, ty) in the yawed frame
  #place({ yaw, tilt, d, tx, ty }) {
    const cam = this.camera;
    this.#target.set(tx, ty, 0).applyAxisAngle(UP, yaw);
    cam.position.set(tx, ty - d * Math.sin(tilt), d * Math.cos(tilt)).applyAxisAngle(UP, yaw);
    cam.lookAt(this.#target);
    cam.updateMatrixWorld();
  }

  // the closest view at these angles that fits the whole arena on screen, centred
  #solve(yaw, tilt) {
    const { width: w, height: h } = this.viewport;
    const cam = this.camera;
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const v = new THREE.Vector3();
    const view = { yaw, tilt, d: 1000, tx: 0, ty: 0 };
    const extent = () => {
      let left = Infinity, right = -Infinity, top = -Infinity, bot = Infinity;
      for (const c of corners) {
        v.copy(c).project(cam);
        left = Math.min(left, v.x); right = Math.max(right, v.x);
        top = Math.max(top, v.y); bot = Math.min(bot, v.y);
      }
      return { left, right, top, bot };
    };
    const fits = e => e.left >= -0.96 && e.right <= 0.96 && e.top <= 0.86 && e.bot >= -0.9;
    // binary-search the distance that fits
    const fitDistance = () => {
      let lo = 50, hi = 50000;
      for (let i = 0; i < 40; i++) {
        view.d = (lo + hi) / 2; this.#place(view);
        if (fits(extent())) hi = view.d; else lo = view.d;
      }
      view.d = hi; this.#place(view);
    };
    // fit, re-centre, repeat to converge, then fit once more
    for (let it = 0; it < 8; it++) {
      fitDistance();
      const e = extent();
      view.tx += ((e.left + e.right) / 2) * w * 0.35;
      view.ty += ((e.top + e.bot) / 2 + 0.02) * h * 0.35;
    }
    fitDistance();
    return view;
  }
}
