import { EVENTS } from '../core/EventBus.js';
import { rand, TAU } from '../core/math.js';

const COLORS = ['#ff5d73', '#4dd2ff', '#ffd23f', '#9dff5c', '#c7a6ff', '#ff8a3a', '#ffffff'];
const GRAVITY = 260;      // px/s^2 on sparks
const ROCKET_GRAVITY = 380;

// The victory celebration: rockets rise from the bottom of the screen and
// burst into showers of sparks. Pure data in screen pixels, so the overlay can
// draw it on top of everything; each burst is announced for the sound.
export class Fireworks {
  rockets = [];
  sparks = [];
  #next = 0;

  constructor(bus, viewport) {
    this.bus = bus;
    this.viewport = viewport;
  }

  // on: whether the show should be running this step
  update(dt, on) {
    if (!on) {
      if (this.rockets.length || this.sparks.length) { this.rockets = []; this.sparks = []; }
      this.#next = 0;
      return;
    }
    const { width: w, height: h } = this.viewport;
    this.#next -= dt;
    if (this.#next <= 0) {
      this.#next = rand(0.18, 0.5);
      this.rockets.push({
        x: rand(w * 0.08, w * 0.92), y: h + 10, vx: rand(-60, 60), vy: -rand(h * 0.85, h * 1.15),
        fuse: rand(0.75, 1.15), color: COLORS[Math.floor(rand(0, COLORS.length))],
      });
    }
    for (const r of this.rockets) {
      r.vy += ROCKET_GRAVITY * dt;
      r.x += r.vx * dt; r.y += r.vy * dt;
      r.fuse -= dt;
      this.sparks.push({ x: r.x, y: r.y, vx: rand(-15, 15), vy: rand(10, 40), life: 0.35, max: 0.35, color: '#ffd8a0', size: 1.5 });
      if (r.fuse <= 0) this.#burst(r);
    }
    this.rockets = this.rockets.filter(r => r.fuse > 0);
    const drag = Math.exp(-1.6 * dt);
    for (const s of this.sparks) {
      s.vx *= drag; s.vy = s.vy * drag + GRAVITY * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
  }

  // a sphere of sparks; some bursts get a second colour or a ring shape
  #burst(r) {
    const n = Math.floor(rand(70, 110)), ring = Math.random() < 0.3, second = COLORS[Math.floor(rand(0, COLORS.length))];
    const power = rand(170, 260);
    for (let i = 0; i < n; i++) {
      const a = ring ? i * TAU / n : rand(0, TAU), sp = ring ? power : power * Math.sqrt(Math.random());
      const life = rand(1.1, 1.8);
      this.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life,
        color: i % 3 === 0 ? second : r.color, size: rand(1.6, 2.8) });
    }
    this.bus.emit(EVENTS.FIREWORK_BURST, { x: r.x, y: r.y });
  }
}
