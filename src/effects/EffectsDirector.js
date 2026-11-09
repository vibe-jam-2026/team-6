import { EVENTS } from '../core/EventBus.js';
import { rand, TAU } from '../core/math.js';

const PLANE_DEBRIS = '#ff7a3a';
const DRONE_SPARKS = '#8fd0ff';
const FLAME = '#ffb347';
const SHIELD = '#9fe4ff';
const ROCKET_SMOKE = '#6b707a';

// Turns game events into particle effects: explosions, debris and engine trails.
export class EffectsDirector {
  constructor(bus, particles) {
    this.particles = particles;
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid: a }) =>
      particles.burst(a.x, a.y, a.size === 1 ? DRONE_SPARKS : PLANE_DEBRIS, 8 + a.size * 6, 90 + a.size * 30, 0.9));
    bus.on(EVENTS.SHIP_DESTROYED, ({ ship }) => this.#shipExplosion(ship));
    bus.on(EVENTS.SELF_DESTRUCT, e => this.#selfDestruct(e));
    bus.on(EVENTS.SHIELD_HIT, ({ ship: s }) => particles.burst(s.x, s.y, SHIELD, 28, 200, 0.6));
    bus.on(EVENTS.BOSS_HIT, ({ boss, x, y }) => particles.burst(x, y, boss.color, 6, 140, 0.4));
    bus.on(EVENTS.BOSS_DESTROYED, ({ boss }) => this.#bossExplosion(boss));
    // when a wave's time runs out, each enemy still flying leaves with a pale puff
    bus.on(EVENTS.ENEMIES_RETREATED, ({ enemies }) => {
      for (const a of enemies) particles.burst(a.x, a.y, DRONE_SPARKS, 6 + a.size * 3, 60 + a.size * 20, 0.7);
    });
  }

  update(dt, world) {
    for (const s of world.ships) if (s.alive && s.thrusting && Math.random() < 0.7) this.#engineTrail(s);
    for (const b of world.bullets) if (Math.random() < 0.6) this.#rocketTrail(b);
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

  // a fireball, a fast shockwave ring that sweeps the arena, and lots of debris
  #selfDestruct({ ship, x, y }) {
    const p = this.particles;
    p.burst(x, y, '#ffffff', 120, 520, 1.2);
    p.burst(x, y, FLAME, 220, 700, 1.8);
    p.burst(x, y, ship.color, 160, 420, 2.2);
    for (let i = 0; i < 260; i++) {
      const a = (i / 260) * TAU, sp = rand(1300, 1500);
      p.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, color: i % 3 ? '#ffe2a8' : ship.color });
    }
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU), sp = rand(60, 260);
      p.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(50, 300), life: rand(2, 3.2), color: ship.color });
    }
  }

  #bossExplosion(b) {
    this.particles.burst(b.x, b.y, b.color, 220, 420, 2.2);
    this.particles.burst(b.x, b.y, FLAME, 140, 300, 1.8);
    this.particles.burst(b.x, b.y, '#ffffff', 80, 220, 1.2);
    for (let i = 0; i < 6; i++) {
      const a = rand(0, TAU), r = rand(10, b.radius);
      this.particles.burst(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, PLANE_DEBRIS, 25, 180, 1.5);
    }
  }

  #engineTrail(s) {
    const bx = s.x - Math.cos(s.angle) * 16, by = s.y - Math.sin(s.angle) * 16;
    const sp = rand(80, 160), ang = s.angle + Math.PI + rand(-0.35, 0.35);
    this.particles.add({ x: bx, y: by, vx: s.vx + Math.cos(ang) * sp, vy: s.vy + Math.sin(ang) * sp,
      life: rand(0.15, 0.35), max: 0.35, color: Math.random() < 0.5 ? FLAME : s.color });
  }

  #rocketTrail(b) {
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp;
    this.particles.add({ x: b.x - ux * 6, y: b.y - uy * 6, z: 4, vx: -ux * 40 + rand(-15, 15), vy: -uy * 40 + rand(-15, 15),
      vz: rand(0, 20), life: rand(0.2, 0.4), max: 0.4, color: Math.random() < 0.3 ? FLAME : ROCKET_SMOKE });
  }
}
