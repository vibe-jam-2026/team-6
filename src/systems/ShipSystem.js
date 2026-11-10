import { EVENTS } from '../core/EventBus.js';

// Flies the ships: respawning, movement, power-up timers and firing.
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
      const weapon = ship.powerup;
      if (ship.tickPowerup(dt)) this.bus.emit(EVENTS.POWERUP_EXPIRED, { ship, weapon });
      const inFlight = world.bullets.filter(b => b.owner === ship).length;
      const bullets = ship.tryFire(inFlight);
      if (bullets.length) {
        world.bullets.push(...bullets);
        this.bus.emit(EVENTS.SHOT_FIRED, { ship });
      }
    }
  }
}
