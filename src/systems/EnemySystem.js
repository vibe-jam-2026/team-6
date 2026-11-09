import { WAVES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Runs the enemies during a match: planes steer and shoot, zeppelins launch
// drones, then everyone moves. (The lobby only drifts them with
// world.updateAsteroids, so nothing there shoots.)
export class EnemySystem {
  constructor(bus) {
    this.bus = bus;
  }

  update(dt, world) {
    for (const enemy of [...world.asteroids]) {
      const { shots, launches } = enemy.think(dt, world);
      if (shots.length) {
        world.bullets.push(...shots);
        this.bus.emit(EVENTS.ENEMY_FIRED, { enemy });
      }
      for (const drone of launches) {
        if (world.asteroids.length >= WAVES.maxEnemies) break;
        world.asteroids.push(drone);
        this.bus.emit(EVENTS.DRONE_LAUNCHED, { from: enemy, drone });
      }
    }
    world.updateAsteroids(dt);
  }
}
