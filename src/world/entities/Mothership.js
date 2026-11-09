import { MOTHERSHIP } from '../../config.js';
import { dist2, rand, TAU } from '../../core/math.js';
import { Asteroid } from './Asteroid.js';
import { Bullet } from './Bullet.js';

const EDGE_MARGIN = MOTHERSHIP.radius + 40;
const SHIELD_ARC = 2.1;           // radians of the hull the shield covers
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

// The final boss: a huge carrier. Same outside as Boss (hp, entering,
// vulnerable, enraged, update -> bullets) so the HUD, collisions and effects
// treat it like any boss, plus:
//   - a shield arc that turns around the hull and soaks up shots from that side
//   - fighters it launches (collected with drainLaunches())
//   - its own attacks: bullet walls with a gap, heavy cannon shells and,
//     when enraged, counter-rotating spirals
export class Mothership {
  kind = 'mothership';
  title = 'MOTHERSHIP';
  radius = MOTHERSHIP.radius;
  color = MOTHERSHIP.color;
  hitScore = MOTHERSHIP.hitScore;
  hitBounty = MOTHERSHIP.hitBounty;
  killScore = MOTHERSHIP.killScore;
  #queue = [];          // scheduled shots: { delay, make: () => Bullet[] }
  #attackTimer = 2;
  #pattern = 0;
  #launchTimer = 4;
  #launches = [];       // fighters waiting to be put into the world
  #fighters = [];       // fighters of its own still flying
  #target = null;

  constructor(x, y, hp) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.hp = this.maxHp = hp;
    this.level = 2;
    this.angle = 0;          // hull spin, for the view
    this.shieldAngle = 0;    // centre of the shield arc
    this.entry = MOTHERSHIP.entryTime;
    this.flash = 0;
    this.shieldFlash = 0;
  }

  get alive() { return this.hp > 0; }
  get entering() { return this.entry > 0; }
  get vulnerable() { return this.alive && !this.entering; }
  get enraged() { return this.hp <= this.maxHp / 2; }
  get entryProgress() { return 1 - Math.max(0, this.entry) / MOTHERSHIP.entryTime; }
  get health() { return Math.max(0, this.hp / this.maxHp); }
  get shieldArc() { return SHIELD_ARC; }

  takeHit(damage = 1) {
    this.hp -= damage;
    this.flash = 0.08;
  }

  // true if a shot coming in at this point lands on the shield instead of the hull
  deflects(at) {
    const side = Math.atan2(at.y - this.y, at.x - this.x);
    if (Math.abs(wrapAngle(side - this.shieldAngle)) > SHIELD_ARC / 2) return false;
    this.shieldFlash = 0.12;
    return true;
  }

  // fighters launched since the last call
  drainLaunches() {
    const out = this.#launches;
    this.#launches = [];
    return out;
  }

  update(dt, world) {
    this.flash = Math.max(0, this.flash - dt);
    this.shieldFlash = Math.max(0, this.shieldFlash - dt);
    this.angle += 0.25 * dt;
    this.shieldAngle += (this.enraged ? 1.3 : 0.7) * dt;
    if (this.entering) { this.entry -= dt; return []; }
    this.#move(dt, world);
    this.#launchFighters(dt, world);
    this.#attackTimer -= dt;
    if (this.#attackTimer <= 0) {
      this.#nextAttack(world);
      this.#attackTimer = this.enraged ? 1.6 : 2.4;
    }
    return this.#fireDue(dt);
  }

  #move(dt, world) {
    const { width: w, height: h } = world;
    if (!this.#target || dist2(this, this.#target) < 40 ** 2) {
      this.#target = { x: rand(EDGE_MARGIN, Math.max(EDGE_MARGIN, w - EDGE_MARGIN)), y: rand(EDGE_MARGIN, Math.max(EDGE_MARGIN, h - EDGE_MARGIN)) };
    }
    const speed = MOTHERSHIP.speed * (this.enraged ? 1.4 : 1);
    const dx = this.#target.x - this.x, dy = this.#target.y - this.y, d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dt);
    this.vx += ((dx / d) * speed - this.vx) * k;
    this.vy += ((dy / d) * speed - this.vy) * k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  #launchFighters(dt, world) {
    this.#fighters = this.#fighters.filter(f => world.asteroids.includes(f));
    this.#launchTimer -= dt;
    if (this.#launchTimer > 0) return;
    this.#launchTimer = this.enraged ? MOTHERSHIP.launchEvery * 0.7 : MOTHERSHIP.launchEvery;
    const n = Math.min(this.enraged ? MOTHERSHIP.fighters + 1 : MOTHERSHIP.fighters, MOTHERSHIP.maxFighters - this.#fighters.length);
    for (let i = 0; i < n; i++) {
      const heading = this.shieldAngle + Math.PI + (i - (n - 1) / 2) * 0.5; // out of the open side, the hangar
      const f = new Asteroid(2, this.x + Math.cos(heading) * this.radius, this.y + Math.sin(heading) * this.radius, world.speedScale, { heading });
      this.#fighters.push(f);
      this.#launches.push(f);
    }
  }

  #nextAttack(world) {
    const attacks = this.enraged
      ? [() => this.#wall(world), () => this.#twinSpiral(), () => this.#cannon(world), () => this.#wall(world)]
      : [() => this.#wall(world), () => this.#cannon(world)];
    attacks[this.#pattern++ % attacks.length]();
  }

  // a line of bullets marching towards the nearest jet, with one gap to slip through
  #wall(world) {
    const target = this.#nearestShip(world);
    const dir = target ? Math.atan2(target.y - this.y, target.x - this.x) : rand(0, TAU);
    const n = 21, spacing = 30, gap = Math.floor(rand(3, n - 5)), gapSize = this.enraged ? 2 : 3;
    const px = -Math.sin(dir), py = Math.cos(dir), speed = MOTHERSHIP.bullet.speed;
    const rows = this.enraged ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      this.#queue.push({ delay: r * 0.7, make: () => {
        const shots = [];
        for (let i = 0; i < n; i++) {
          if (i >= gap && i < gap + gapSize) continue;
          const o = (i - (n - 1) / 2) * spacing;
          shots.push(this.#bullet(this.x + px * o + Math.cos(dir) * this.radius * 0.6, this.y + py * o + Math.sin(dir) * this.radius * 0.6, dir, speed, MOTHERSHIP.bullet));
        }
        return shots;
      } });
    }
  }

  // slow heavy shells at every jet, three in a row
  #cannon(world) {
    for (const s of world.ships.filter(s => s.alive)) {
      for (let k = 0; k < 3; k++) {
        this.#queue.push({ delay: k * 0.3, make: () => {
          const a = Math.atan2(s.y - this.y, s.x - this.x) + rand(-0.08, 0.08);
          return [this.#bullet(this.x + Math.cos(a) * this.radius * 0.7, this.y + Math.sin(a) * this.radius * 0.7, a, MOTHERSHIP.shell.speed, MOTHERSHIP.shell)];
        } });
      }
    }
  }

  // two streams turning opposite ways
  #twinSpiral() {
    const start = rand(0, TAU);
    for (let i = 0; i < 24; i++) {
      for (const sign of [1, -1]) {
        for (let arm = 0; arm < 2; arm++) {
          this.#queue.push({ delay: i * 0.08, make: () => {
            const a = start + sign * i * 0.26 + arm * Math.PI;
            return [this.#bullet(this.x + Math.cos(a) * this.radius * 0.5, this.y + Math.sin(a) * this.radius * 0.5, a, MOTHERSHIP.bullet.speed, MOTHERSHIP.bullet)];
          } });
        }
      }
    }
  }

  #fireDue(dt) {
    const fired = [];
    for (const shot of this.#queue) shot.delay -= dt;
    for (const shot of this.#queue.filter(s => s.delay <= 0)) fired.push(...shot.make());
    this.#queue = this.#queue.filter(s => s.delay > 0);
    return fired;
  }

  #bullet(x, y, angle, speed, kind) {
    return new Bullet(this, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      { life: kind.life, radius: kind.radius, hostile: true });
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
}
