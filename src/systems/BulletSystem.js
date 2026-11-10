import { HOMING } from '../config.js';

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

// Moves every bullet, steering homing missiles towards their targets first.
export class BulletSystem {
  update(dt, world, mode = null) {
    for (const b of world.bullets) {
      if (b.weapon?.homing && !b.dead) this.#steer(b, dt, world, mode);
      b.update(dt, world.bounds);
    }
  }

  removeSpent(world) {
    world.bullets = world.bullets.filter(b => !b.dead);
  }

  // Turns the missile's velocity towards its target, keeping its speed.
  #steer(b, dt, world, mode) {
    if (!this.#stillValid(b.target, b, world, mode)) b.target = this.#acquire(b, world, mode);
    const t = b.target;
    if (!t) return;
    const heading = Math.atan2(b.vy, b.vx);
    const diff = wrapAngle(Math.atan2(t.y - b.y, t.x - b.x) - heading);
    const turn = Math.max(-1, Math.min(1, diff / (b.weapon.homing * dt))) * b.weapon.homing * dt;
    const speed = Math.hypot(b.vx, b.vy), a = heading + turn;
    b.vx = Math.cos(a) * speed;
    b.vy = Math.sin(a) * speed;
  }

  // enemies, the boss and, when friendly fire is on, the other pilots
  #targets(b, world, mode) {
    const list = [...world.asteroids, ...world.groundTargets];
    if (world.boss?.vulnerable) list.push(world.boss);
    if (mode?.friendlyFire) list.push(...world.ships.filter(s => s !== b.owner && s.vulnerable));
    return list;
  }

  #stillValid(t, b, world, mode) {
    if (!t) return false;
    if (t === world.boss) return t.vulnerable;
    if (world.ships.includes(t)) return !!mode?.friendlyFire && t.vulnerable;
    return world.asteroids.includes(t) || world.groundTargets.includes(t);
  }

  // the closest target in the cone ahead, favouring those straight in front
  #acquire(b, world, mode) {
    const heading = Math.atan2(b.vy, b.vx);
    let best = null, bestScore = Infinity;
    for (const t of this.#targets(b, world, mode)) {
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy);
      const off = Math.abs(wrapAngle(Math.atan2(dy, dx) - heading));
      if (d > HOMING.range || off > HOMING.cone) continue;
      const score = d * (1 + off);
      if (score < bestScore) { best = t; bestScore = score; }
    }
    return best;
  }
}
