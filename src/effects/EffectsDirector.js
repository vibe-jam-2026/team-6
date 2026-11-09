import { EVENTS } from '../core/EventBus.js';
import { rand, TAU } from '../core/math.js';

const ROCK_DUST = '#c9cfdc';
const FLAME = '#ffb347';

// Turns game events into particle effects: explosions, debris and engine trails.
export class EffectsDirector {
  constructor(bus, particles) {
    this.particles = particles;
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid: a }) =>
      particles.burst(a.x, a.y, ROCK_DUST, 8 + a.size * 6, 90 + a.size * 30, 0.9));
    bus.on(EVENTS.SHIP_DESTROYED, ({ ship }) => this.#shipExplosion(ship));
  }

  update(dt, world) {
    for (const s of world.ships) if (s.alive && s.thrusting && Math.random() < 0.7) this.#engineTrail(s);
    this.particles.update(dt);
  }

  #shipExplosion(s) {
    this.particles.burst(s.x, s.y, s.color, 60, 260, 1.4);
    this.particles.burst(s.x, s.y, '#ffffff', 20, 160, 0.8);
    for (let i = 0; i < 5; i++) {
      const a = rand(0, TAU), sp = rand(30, 110);
      this.particles.add({ x: s.x, y: s.y, vx: Math.cos(a) * sp + s.vx * 0.3, vy: Math.sin(a) * sp + s.vy * 0.3,
        vz: rand(-40, 120), life: 1.6, color: s.color });
    }
  }

  #engineTrail(s) {
    const bx = s.x - Math.cos(s.angle) * 12, by = s.y - Math.sin(s.angle) * 12;
    const sp = rand(80, 160), ang = s.angle + Math.PI + rand(-0.35, 0.35);
    this.particles.add({ x: bx, y: by, vx: s.vx + Math.cos(ang) * sp, vy: s.vy + Math.sin(ang) * sp,
      life: rand(0.15, 0.35), max: 0.35, color: Math.random() < 0.5 ? FLAME : s.color });
  }
}
