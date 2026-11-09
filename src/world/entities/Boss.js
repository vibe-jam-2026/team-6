import { BOSS } from '../../config.js';
import { dist2, rand, TAU } from '../../core/math.js';
import { Bullet } from './Bullet.js';

const EDGE_MARGIN = BOSS.radius + 50;

// A big armoured core that drifts around the arena and sprays bullet patterns.
// It warps in untouchable, and gets faster and angrier below half health.
export class Boss {
  radius = BOSS.radius;
  color = BOSS.color;
  #queue = [];         // scheduled shots: { delay, angle, speed }
  #attackTimer = 1.2;
  #pattern = 0;
  #target = null;

  constructor(x, y, hp, level = 1) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.hp = this.maxHp = hp;
    this.level = level;
    this.angle = 0;     // spin of the armour ring
    this.entry = BOSS.entryTime;
    this.flash = 0;     // > 0 right after a hit, for the view
  }

  get alive() { return this.hp > 0; }
  get entering() { return this.entry > 0; }
  get vulnerable() { return this.alive && !this.entering; }
  get enraged() { return this.hp <= this.maxHp / 2; }
  get entryProgress() { return 1 - Math.max(0, this.entry) / BOSS.entryTime; } // 0..1 while warping in
  get health() { return Math.max(0, this.hp / this.maxHp); }

  takeHit(damage = 1) {
    this.hp -= damage;
    this.flash = 0.08;
  }

  // Moves and attacks; returns the bullets fired this step.
  update(dt, world) {
    this.flash = Math.max(0, this.flash - dt);
    this.angle += (this.enraged ? 1.6 : 0.8) * dt;
    if (this.entering) { this.entry -= dt; return []; }
    this.#move(dt, world);
    this.#attackTimer -= dt;
    if (this.#attackTimer <= 0) {
      this.#queueNextPattern(world);
      this.#attackTimer = this.enraged ? 1.25 : 1.9;
    }
    return this.#fireDue(dt);
  }

  #move(dt, world) {
    const { width: w, height: h } = world;
    if (!this.#target || dist2(this, this.#target) < 40 ** 2) {
      this.#target = { x: rand(EDGE_MARGIN, Math.max(EDGE_MARGIN, w - EDGE_MARGIN)), y: rand(EDGE_MARGIN, Math.max(EDGE_MARGIN, h - EDGE_MARGIN)) };
    }
    const speed = BOSS.speed * (this.enraged ? 1.6 : 1);
    const dx = this.#target.x - this.x, dy = this.#target.y - this.y, d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dt * 1.5);
    this.vx += ((dx / d) * speed - this.vx) * k;
    this.vy += ((dy / d) * speed - this.vy) * k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  #queueNextPattern(world) {
    const patterns = [() => this.#ring(), () => this.#aimed(world), () => this.#spiral()];
    patterns[this.#pattern++ % patterns.length]();
  }

  // evenly spaced ring, two waves when enraged
  #ring() {
    const n = 12 + this.level * 2 + (this.enraged ? 4 : 0);
    const offset = rand(0, TAU);
    const rings = this.enraged ? 2 : 1;
    for (let r = 0; r < rings; r++) {
      for (let i = 0; i < n; i++) this.#queue.push({ delay: r * 0.35, angle: offset + (i + r * 0.5) * TAU / n });
    }
  }

  // a fan of shots at the nearest ship, repeated a few times
  #aimed(world) {
    const target = this.#nearestShip(world);
    if (!target) return this.#ring();
    const bursts = this.enraged ? 4 : 3, spread = this.enraged ? 5 : 3;
    for (let b = 0; b < bursts; b++) {
      for (let i = 0; i < spread; i++) {
        this.#queue.push({ delay: b * 0.22, target, spreadIndex: i - (spread - 1) / 2, speed: BOSS.bullet.speed * 1.25 });
      }
    }
  }

  // a rotating stream from two (or three) arms
  #spiral() {
    const arms = this.enraged ? 3 : 2, shots = 16, start = rand(0, TAU);
    for (let i = 0; i < shots; i++) {
      for (let a = 0; a < arms; a++) this.#queue.push({ delay: i * 0.07, angle: start + i * 0.32 + a * TAU / arms });
    }
  }

  #nearestShip(world) {
    let best = null, bestD = Infinity;
    for (const s of world.ships) {
      if (!s.alive) continue;
      const d = dist2(this, s);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  #fireDue(dt) {
    const fired = [];
    for (const shot of this.#queue) shot.delay -= dt;
    for (const shot of this.#queue.filter(s => s.delay <= 0)) {
      let angle = shot.angle;
      if (shot.target) angle = Math.atan2(shot.target.y - this.y, shot.target.x - this.x) + shot.spreadIndex * 0.18;
      fired.push(this.#bullet(angle, shot.speed ?? BOSS.bullet.speed));
    }
    this.#queue = this.#queue.filter(s => s.delay > 0);
    return fired;
  }

  #bullet(angle, speed) {
    const nx = Math.cos(angle), ny = Math.sin(angle), r = this.radius * 0.8;
    return new Bullet(this, this.x + nx * r, this.y + ny * r, nx * speed, ny * speed,
      { life: BOSS.bullet.life, radius: BOSS.bullet.radius, hostile: true });
  }
}
