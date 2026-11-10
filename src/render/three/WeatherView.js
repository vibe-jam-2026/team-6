import * as THREE from 'three';

// Weather over each landscape, drawn in the air between the ground and the
// camera. Two kinds of particle:
//   'flakes'  soft dots that drift (snow, embers, magic motes)
//   'streaks' short lines along their velocity (rain, blowing sand)
// Particles live in a box over the visible part of the arena and wrap round
// inside it, so the weather never runs out. Scene units: z is up.
//   vel: base velocity [x, y, z] per second, jitter: random extra per particle
//   sway: side-to-side wobble (flakes), len: streak length in seconds of travel
const PRESETS = {
  forest: { kind: 'streaks', count: 650, color: 0xb4c6d8, opacity: 0.5, vel: [-30, 25, -620], jitter: 25, len: 0.06 },
  coast: { kind: 'streaks', count: 480, color: 0xbac8da, opacity: 0.45, vel: [-90, 30, -560], jitter: 30, len: 0.06 },
  alps: { kind: 'flakes', count: 1100, color: 0xffffff, size: 13, opacity: 0.9, vel: [18, -12, -48], jitter: 18, sway: 14 },
  realm: { kind: 'flakes', count: 420, color: 0xc08cff, size: 15, opacity: 1, additive: true, vel: [0, 0, 26], jitter: 14, sway: 20, twinkle: true },
  desert: { kind: 'streaks', count: 800, color: 0xe6c690, opacity: 0.45, vel: [430, 70, -12], jitter: 70, len: 0.1 },
  volcano: { kind: 'flakes', count: 650, color: 0xff8a3a, size: 14, opacity: 1, additive: true, vel: [25, 10, 70], jitter: 30, sway: 10, twinkle: true },
  arctic: { kind: 'flakes', count: 1500, color: 0xf2f6ff, size: 11, opacity: 0.9, vel: [170, 45, -70], jitter: 40, sway: 8 },
  neon: { kind: 'streaks', count: 900, color: 0x7fe0ff, opacity: 0.55, vel: [-45, 30, -820], jitter: 30, len: 0.05, additive: true },
  moon: null, // no air, no weather
};
const Z_MIN = -55, Z_MAX = 380;

export class WeatherView {
  #key = undefined;
  #viewport = null;
  #mesh = null;
  #parts = null; // { pos: Float32Array (x,y,z per particle), vel, phase }
  #time = 0;

  constructor(scene, dotTexture) {
    this.scene = scene;
    this.dot = dotTexture;
  }

  fit(viewport) {
    this.#viewport = viewport;
    this.#build();
  }

  show(key) {
    if (key === this.#key) return;
    this.#key = key;
    this.#build();
  }

  #build() {
    if (this.#mesh) {
      this.scene.remove(this.#mesh);
      this.#mesh.geometry.dispose();
      this.#mesh.material.dispose();
      this.#mesh = null;
    }
    const preset = PRESETS[this.#key];
    if (!preset || !this.#viewport) return;
    const { width: w, height: h } = this.#viewport;
    this.box = { x0: -w * 0.8, x1: w * 0.8, y0: -h * 0.75, y1: h * 1.25 };
    const n = preset.count, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), phase = new Float32Array(n);
    const j = () => (Math.random() * 2 - 1) * preset.jitter;
    for (let i = 0; i < n; i++) {
      pos.set([this.#rand(this.box.x0, this.box.x1), this.#rand(this.box.y0, this.box.y1), this.#rand(Z_MIN, Z_MAX)], i * 3);
      vel.set([preset.vel[0] + j(), preset.vel[1] + j(), preset.vel[2] + j() * 0.5], i * 3);
      phase[i] = Math.random() * Math.PI * 2;
    }
    this.#parts = { pos, vel, phase, preset };
    const blending = preset.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    const geometry = new THREE.BufferGeometry();
    if (preset.kind === 'flakes') {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.#mesh = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: preset.size, map: this.dot, color: preset.color, transparent: true, opacity: preset.opacity, depthWrite: false, blending,
      }));
    } else {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
      this.#mesh = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
        color: preset.color, transparent: true, opacity: preset.opacity, depthWrite: false, blending,
      }));
    }
    this.#mesh.frustumCulled = false;
    this.#mesh.renderOrder = 2;
    this.scene.add(this.#mesh);
  }

  #rand(a, b) { return a + Math.random() * (b - a); }

  update(dt) {
    if (!this.#mesh) return;
    this.#time += dt;
    const { pos, vel, phase, preset } = this.#parts, box = this.box, t = this.#time;
    const out = this.#mesh.geometry.attributes.position.array;
    const W = box.x1 - box.x0, H = box.y1 - box.y0, Z = Z_MAX - Z_MIN;
    const wrap = (v, lo, size) => (v < lo ? v + size : v >= lo + size ? v - size : v);
    for (let i = 0, n = phase.length; i < n; i++) {
      const k = i * 3;
      pos[k] = wrap(pos[k] + vel[k] * dt, box.x0, W);
      pos[k + 1] = wrap(pos[k + 1] + vel[k + 1] * dt, box.y0, H);
      pos[k + 2] = wrap(pos[k + 2] + vel[k + 2] * dt, Z_MIN, Z);
      if (preset.kind === 'flakes') {
        const sway = preset.sway ? Math.sin(t * 1.3 + phase[i]) * preset.sway : 0;
        out[k] = pos[k] + sway; out[k + 1] = pos[k + 1] + sway * 0.5; out[k + 2] = pos[k + 2];
      } else {
        const o = i * 6, l = preset.len;
        out[o] = pos[k]; out[o + 1] = pos[k + 1]; out[o + 2] = pos[k + 2];
        out[o + 3] = pos[k] - vel[k] * l; out[o + 4] = pos[k + 1] - vel[k + 1] * l; out[o + 5] = pos[k + 2] - vel[k + 2] * l;
      }
    }
    if (preset.twinkle) this.#mesh.material.opacity = preset.opacity * (0.75 + 0.25 * Math.sin(t * 5));
    this.#mesh.geometry.attributes.position.needsUpdate = true;
  }
}
