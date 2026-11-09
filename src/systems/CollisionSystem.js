import { circlesOverlap } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';

// Detects contacts and resolves them through World. Whether bullets hurt
// other ships is the game mode's decision, not this system's.
export class CollisionSystem {
  constructor(bus) {
    this.bus = bus;
  }

  update(world, mode) {
    this.#bumpShips(world);
    this.#bulletsVsAsteroids(world);
    if (mode.friendlyFire) this.#bulletsVsShips(world);
    this.#shipsVsAsteroids(world);
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

  #bulletsVsAsteroids(world) {
    for (const b of world.bullets) {
      if (b.dead) continue;
      const rock = world.asteroids.find(a => circlesOverlap(b, b.radius, a, a.radius * 0.92));
      if (rock) { b.expire(); world.destroyAsteroid(rock, b.owner); }
    }
  }

  #bulletsVsShips(world) {
    for (const b of world.bullets) {
      if (b.dead) continue;
      const target = world.ships.find(s => s !== b.owner && s.vulnerable && circlesOverlap(b, b.radius, s, s.radius));
      if (target) { b.expire(); world.destroyShip(target, b.owner); }
    }
  }

  #shipsVsAsteroids(world) {
    for (const s of world.ships) {
      if (!s.vulnerable) continue;
      const rock = world.asteroids.find(a => circlesOverlap(s, s.radius * 0.8, a, a.radius * 0.9));
      if (rock) { world.destroyShip(s); world.destroyAsteroid(rock); }
    }
  }
}
