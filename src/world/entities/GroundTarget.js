import { GROUND } from '../../config.js';
import { rand } from '../../core/math.js';
import { Bullet } from './Bullet.js';

// shortest offset across a wrapping axis
const wrapDelta = (d, size) => d - size * Math.round(d / size);

// An anti-aircraft gun on the ground below the arena. It never moves; it
// swings its turret towards the nearest jet and fires flak up at it, leading
// the shot. Jets can't collide with it (it is far below them), but their
// shots hit it. It carries the same score / bounty / size fields as the other
// enemies, so scoring, money, sound and explosions treat it like one.
export class GroundTarget {
  kind = 'flak';
  size = 2;
  ground = true;
  vx = 0; vy = 0;

  constructor(x, y) {
    Object.assign(this, { x, y });
    this.radius = GROUND.radius;
    this.hp = GROUND.hp;
    this.score = GROUND.score;
    this.bounty = GROUND.bounty;
    this.color = GROUND.color;
    this.aim = rand(0, Math.PI * 2);   // turret heading, for the 3D view
    this.recoil = 0;                   // 1 right after a shot, fading to 0
    this.reload = rand(...GROUND.fireEvery) * 0.6;
  }

  get alive() { return this.hp > 0; }

  takeHit(damage = 1) {
    this.hp -= damage;
    return this.hp <= 0;
  }

  // Turn towards the nearest jet in range and fire when loaded; returns the shots.
  think(dt, world) {
    this.recoil = Math.max(0, this.recoil - dt * 3);
    const target = this.#nearestJet(world);
    if (!target) return [];
    const { dx, dy } = target;
    const b = GROUND.bullet;
    // lead the jet: where it will be when the flak gets there
    const t = Math.hypot(dx, dy) / b.speed;
    const ax = dx + target.ship.vx * t, ay = dy + target.ship.vy * t;
    this.aim = Math.atan2(ay, ax);
    if ((this.reload -= dt) > 0) return [];
    this.reload = rand(...GROUND.fireEvery);
    this.recoil = 1;
    const nx = Math.cos(this.aim), ny = Math.sin(this.aim);
    return [new Bullet(this, this.x + nx * 10, this.y + ny * 10, nx * b.speed, ny * b.speed,
      { life: b.life, radius: b.radius, hostile: true })];
  }

  #nearestJet(world) {
    let best = null;
    for (const ship of world.ships) {
      if (!ship.alive) continue;
      const dx = wrapDelta(ship.x - this.x, world.width), dy = wrapDelta(ship.y - this.y, world.height);
      const d = Math.hypot(dx, dy);
      if (d <= GROUND.range && (!best || d < best.d)) best = { ship, dx, dy, d };
    }
    return best;
  }
}
