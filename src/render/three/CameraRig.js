import * as THREE from 'three';
import { EVENTS } from '../../core/EventBus.js';
import { rand } from '../../core/math.js';
import { CAMERA_SPIN } from '../../config.js';

const TILT = 0.48;          // radians from straight down (the default view)
const SHAKE_DECAY = 30;     // units per second
const UP = new THREE.Vector3(0, 0, 1);
const FP_BLEND = 0.6;       // seconds to swing into / out of the cockpit view
const FP_EYE = 22;          // eye height above the jet (a little above, to clear the scenery)
const FP_LOOK = 320;        // how far ahead the cockpit view looks
const FP_DIP = 70;          // ...and how far below the eye it aims there
const FP_NEAR = 2, NEAR = 10;
// chase view: a little behind and above the jet, following it on springs
const CH_BACK = 150;        // distance behind the jet
const CH_HEIGHT = 60;       // ...and above it
const CH_LOOK = 260;        // how far ahead of the jet it looks
const CH_LIFT = 0;          // aim this far above the jet's height there
const CH_FOLLOW = 7;        // how quickly the eye catches up with its spot (1/s)
const CH_TURN = 3.5;        // how quickly it swings round behind a turning jet (1/s)
const CH_ROLL = 4;          // how quickly it follows the jet's bank (1/s)
const CH_SNAP = 400;        // a jump this big (wrapping round the arena edge) snaps the camera
const CH_BLEND = 0.8;       // seconds to glide between the cockpit and the chase spot

const smooth = k => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);   // frame-rate independent easing

// Positions the tilted camera so the whole arena fits on screen, adds menu drift,
// explosion shake and random swings to new angles during play, and maps screen
// pixels back onto the arena plane. It can also ride in a jet's cockpit (first
// person); the overview camera keeps running behind it for screenToPlane.
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
  #overview;        // copy of the overview camera, for mapping screen pixels
  #fp = 0;          // 0..1 how far into the cockpit view we are
  #eye = new THREE.Vector3();
  #look = new THREE.Vector3();
  #up = new THREE.Vector3();
  #jolt = new THREE.Vector3();   // this frame's explosion shake
  #chase = 0;       // 0..1 how far from the cockpit towards the chase spot we are
  #ch = null;       // the chase camera's smoothed state: { eye, look, heading, bank }

  constructor(camera, bus) {
    this.camera = camera;
    this.#overview = camera.clone();
    bus.on(EVENTS.SHIP_DESTROYED, () => { this.#shake = 10; });
    bus.on(EVENTS.SELF_DESTRUCT, () => { this.#shake = 45; });
    bus.on(EVENTS.BOSS_DESTROYED, () => { this.#shake = 28; });
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid }) => { this.#shake = Math.max(this.#shake, asteroid.size * 2); });
  }

  resetShake() { this.#shake = 0; }

  // distance from the camera to the point it looks at (the scenery fades its fog by it)
  get distance() {
    const d = this.#view ? this.#view.d : this.camera.position.length();
    if (!this.#fp || !this.viewport) return d;
    return lerp(d, Math.max(this.viewport.width, this.viewport.height) * 0.5, smooth(this.#fp));
  }

  // 0..1: how far the camera has swung into the cockpit (1 = fully first person)
  get firstPerson() { return this.#fp * (1 - smooth(this.#chase)); }

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
    this.#snapshot();
  }

  // spin: swing to random angles now and then; otherwise ease back to the default view
  // pilot: { x, y, z, angle, bank } in scene space to ride along in that jet's cockpit
  // chase: follow the pilot's jet from a little behind it instead of sitting in its cockpit
  update(dt, t, { drift = false, spin = false, frozen = false, pilot = null, chase = false } = {}) {
    if (!this.#view) return;
    const cam = this.camera;
    if (!frozen) this.#steer(dt, spin);
    this.#shake = Math.max(0, this.#shake - dt * SHAKE_DECAY);
    this.#place(this.#view);
    if (drift) { cam.position.x += Math.sin(t * 0.25) * 60; cam.position.y += Math.cos(t * 0.2) * 30; }
    this.#jolt.set(0, 0, 0);
    if (this.#shake > 0) this.#jolt.set(rand(-this.#shake, this.#shake) * 1.5, rand(-this.#shake, this.#shake) * 1.5, 0);
    cam.position.add(this.#jolt);
    cam.lookAt(this.#target);
    cam.updateMatrixWorld();
    this.#snapshot();
    this.#fp = pilot ? Math.min(1, this.#fp + dt / FP_BLEND) : Math.max(0, this.#fp - dt / FP_BLEND);
    if (this.#fp === 0) this.#ch = null;   // start the chase afresh next time
    if (pilot) {
      // glide between cockpit and chase spot, but swing in from the overview straight to the right one
      if (!this.#ch) this.#chase = chase ? 1 : 0;
      else this.#chase = chase ? Math.min(1, this.#chase + dt / CH_BLEND) : Math.max(0, this.#chase - dt / CH_BLEND);
      this.#aimCockpit(pilot);
      this.#follow(pilot, dt);
      if (this.#chase > 0) {
        const k = smooth(this.#chase);
        this.#eye.lerp(this.#ch.eye, k);
        this.#look.lerp(this.#ch.look, k);
        this.#up.lerp(this.#ch.up, k).normalize();
      }
    }
    if (this.#fp > 0) this.#ride(smooth(this.#fp));
    const near = this.#fp > 0.5 ? FP_NEAR : NEAR;
    if (cam.near !== near) { cam.near = near; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
  }

  // eye, look-at point and up vector inside the pilot's cockpit
  #aimCockpit({ x, y, z, angle, bank }) {
    const fx = Math.cos(angle), fy = -Math.sin(angle);   // game y points down, scene y up
    this.#eye.set(x, y, z + FP_EYE);
    this.#look.set(x + fx * FP_LOOK, y + fy * FP_LOOK, z + FP_EYE - FP_DIP);
    // roll with the jet's bank
    this.#up.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(fx, fy, 0), bank * 0.6);
  }

  // move the chase camera's smoothed spot towards its place behind the jet
  #follow({ x, y, z, angle, bank }, dt) {
    const fresh = !this.#ch;
    if (fresh) this.#ch = { eye: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(), heading: angle, bank };
    const ch = this.#ch;
    ch.heading += wrapAngle(angle - ch.heading) * damp(CH_TURN, dt);
    ch.bank += (bank - ch.bank) * damp(CH_ROLL, dt);
    const fx = Math.cos(ch.heading), fy = -Math.sin(ch.heading);   // game y points down, scene y up
    const eye = new THREE.Vector3(x - fx * CH_BACK, y - fy * CH_BACK, z + CH_HEIGHT);
    const look = new THREE.Vector3(x + fx * CH_LOOK, y + fy * CH_LOOK, z + CH_LIFT);
    // jumped across the arena (it wraps at the edges) or just started: no slow glide over
    if (fresh || ch.eye.distanceTo(eye) > CH_SNAP) {
      ch.eye.copy(eye); ch.look.copy(look); ch.heading = angle;
    } else {
      ch.eye.lerp(eye, damp(CH_FOLLOW, dt));
      ch.look.lerp(look, damp(CH_FOLLOW, dt));
    }
    ch.up.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(fx, fy, 0), ch.bank * 0.35);
  }

  // blend the overview camera (already placed) towards the cockpit by k
  #ride(k) {
    const cam = this.camera;
    const target = this.#target.clone();
    // a softer shake in the cockpit: the eye is far closer to everything
    cam.position.copy(this.#overview.position).lerp(this.#eye, k).addScaledVector(this.#jolt, -0.75 * k);
    cam.up.copy(UP).lerp(this.#up, k).normalize();
    cam.lookAt(target.lerp(this.#look, k));
    cam.up.copy(UP);
  }

  // remember the overview camera so screen pixels still map onto the arena in the cockpit
  #snapshot() {
    const o = this.#overview, cam = this.camera;
    o.position.copy(cam.position);
    o.quaternion.copy(cam.quaternion);
    o.projectionMatrix.copy(cam.projectionMatrix);
    o.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
    o.updateMatrixWorld();
  }

  // screen pixel -> point on the horizontal plane at the given height
  screenToPlane(px, py, height = 0) {
    const { width: w, height: h } = this.viewport;
    this.#raycaster.setFromCamera(new THREE.Vector2((px / w) * 2 - 1, -(py / h) * 2 + 1), this.#overview);
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
