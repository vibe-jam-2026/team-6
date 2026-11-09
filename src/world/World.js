import { EVENTS } from '../core/EventBus.js';

// Owns the entities in play and the two ways things get destroyed.
// Destruction is announced on the bus; scoring, sound and effects listen.
export class World {
  ships = [];
  asteroids = [];
  bullets = [];
  boss = null;
  speedScale = 1; // set by the wave spawner, applied to new rocks

  constructor(bounds, bus) {
    this.bounds = bounds;
    this.bus = bus;
  }

  reset(ships = []) {
    this.ships = ships;
    this.asteroids = [];
    this.bullets = [];
    this.boss = null;
    this.speedScale = 1;
  }

  // removes everything hostile: rocks, the boss and its bullets (used when jumping waves)
  clearField() {
    this.asteroids = [];
    this.boss = null;
    this.bullets = [];
  }

  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }

  updateAsteroids(dt) {
    for (const a of this.asteroids) a.update(dt, this.bounds);
  }

  destroyAsteroid(asteroid, by = null) {
    const i = this.asteroids.indexOf(asteroid);
    if (i < 0) return;
    this.asteroids.splice(i, 1);
    this.asteroids.push(...asteroid.split(this.speedScale));
    this.bus.emit(EVENTS.ASTEROID_DESTROYED, { asteroid, by });
  }

  hitBoss(by, at) {
    const boss = this.boss;
    if (!boss?.vulnerable) return;
    boss.takeHit(1);
    this.bus.emit(EVENTS.BOSS_HIT, { boss, by, x: at.x, y: at.y });
    if (boss.alive) return;
    this.boss = null;
    for (const b of this.bullets) if (b.hostile) b.expire();
    this.bus.emit(EVENTS.BOSS_DESTROYED, { boss, by });
  }

  destroyShip(ship, by = null) {
    if (!ship.alive) return;
    ship.destroy();
    this.bus.emit(EVENTS.SHIP_DESTROYED, { ship, by });
  }
}
