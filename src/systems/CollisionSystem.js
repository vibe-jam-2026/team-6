import { circlesOverlap } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';

// Detects contacts and resolves them through World. Whether bullets hurt
// other ships is the game mode's decision, not this system's.
// With `invincible` (a testing aid) nothing can destroy a ship.
export class CollisionSystem {
  constructor(bus) {
    this.bus = bus;
  }

  update(world, mode, { invincible = false } = {}) {
    const canHit = s => s.vulnerable && !invincible;
    this.#bumpShips(world);
    this.#bulletsVsAsteroids(world);
    this.#bulletsVsBoss(world);
    this.#bulletsVsShips(world, mode.friendlyFire, canHit);
    this.#shipsVsAsteroids(world, canHit);
    this.#shipsVsBoss(world, canHit);
  }

  #bumpShips(world) {
    const ships = world.ships;
    for (let i = 0; i < ships.length; i++) for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i], b = ships[j];
      if (!a.alive || !b.alive || !circlesOverlap(a, a.radius, b, b.radius)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx; b.vy += rel * ny; }
      const push = (a.radius + b.radius - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      this.bus.emit(EVENTS.SHIPS_BUMPED, { a, b });
    }
  }

  // enemy bullets (boss and planes) fly through the other enemies
  #bulletsVsAsteroids(world) {
    for (const b of world.bullets) {
      if (b.dead || b.hostile) continue;
      const enemy = world.asteroids.find(a => circlesOverlap(b, b.radius, a, a.radius * 0.92));
      if (enemy) { b.expire(); world.hitEnemy(enemy, b.owner, b.weapon?.damage ?? 1); }
    }
  }

  #bulletsVsBoss(world) {
    for (const b of world.bullets) {
      const boss = world.boss;
      if (!boss?.vulnerable) return;
      if (b.dead || b.hostile || !circlesOverlap(b, b.radius, boss, boss.radius * 0.9)) continue;
      b.expire();
      world.hitBoss(b.owner, b);
    }
  }

  #bulletsVsShips(world, friendlyFire, canHit) {
    for (const b of world.bullets) {
      if (b.dead || (!b.hostile && !friendlyFire)) continue;
      const target = world.ships.find(s => s !== b.owner && canHit(s) && circlesOverlap(b, b.radius, s, s.radius));
      if (!target) continue;
      b.expire();
      world.destroyShip(target, b.hostile ? null : b.owner);
    }
  }

  #shipsVsAsteroids(world, canHit) {
    for (const s of world.ships) {
      if (!canHit(s)) continue;
      const rock = world.asteroids.find(a => circlesOverlap(s, s.radius * 0.8, a, a.radius * 0.9));
      // a collision costs the jet and counts as one (unpaid) hit on the enemy
      if (rock) { world.destroyShip(s); world.hitEnemy(rock); }
    }
  }

  // ramming the boss is fatal (but it is harmless while still warping in)
  #shipsVsBoss(world, canHit) {
    const boss = world.boss;
    if (!boss?.vulnerable) return;
    for (const s of world.ships) {
      if (canHit(s) && circlesOverlap(s, s.radius * 0.8, boss, boss.radius * 0.85)) world.destroyShip(s);
    }
  }
}
