import { EVENTS } from '../core/EventBus.js';

// Owns the entities in play and the two ways things get destroyed.
// Destruction is announced on the bus; scoring, sound and effects listen.
export class World {
  ships = [];
  asteroids = [];
  bullets = [];
  speedScale = 1; // set by the wave spawner, applied to new rocks

  constructor(bounds, bus) {
    this.bounds = bounds;
    this.bus = bus;
  }

  reset(ships = []) {
    this.ships = ships;
    this.asteroids = [];
    this.bullets = [];
    this.speedScale = 1;
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

  destroyShip(ship, by = null) {
    if (!ship.alive) return;
    ship.destroy();
    this.bus.emit(EVENTS.SHIP_DESTROYED, { ship, by });
  }
}
