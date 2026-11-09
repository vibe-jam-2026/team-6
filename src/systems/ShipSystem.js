import { EVENTS } from '../core/EventBus.js';

// Flies the ships: respawning, movement, and firing.
export class ShipSystem {
  constructor(bus, spawnPlanner) {
    this.bus = bus;
    this.spawnPlanner = spawnPlanner;
  }

  update(dt, world) {
    for (const ship of world.ships) {
      if (!ship.alive) {
        if (ship.tickRespawn(dt)) ship.spawnAt(this.spawnPlanner.findSpot(ship, world));
        continue;
      }
      ship.update(dt, world.bounds);
      const inFlight = world.bullets.filter(b => b.owner === ship).length;
      const bullet = ship.tryFire(inFlight);
      if (bullet) {
        world.bullets.push(bullet);
        this.bus.emit(EVENTS.SHOT_FIRED, { ship });
      }
    }
  }
}
