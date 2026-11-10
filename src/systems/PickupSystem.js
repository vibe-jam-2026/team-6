import { POWERUPS, WEAPONS } from '../config.js';
import { EVENTS } from '../core/EventBus.js';
import { circlesOverlap, pick, rand, TAU } from '../core/math.js';
import { Pickup } from '../world/entities/Pickup.js';

// the weapons a crate can hold: everything but the standard gun
const POWERUP_WEAPONS = WEAPONS.slice(1);

// Weapon power-ups: shot-down enemies sometimes drop a crate, and the first
// live jet to fly into it gets that weapon for POWERUPS.duration seconds.
export class PickupSystem {
  constructor(bus, world) {
    this.bus = bus;
    this.world = world;
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid: a }) => {
      if (Math.random() < (POWERUPS.dropChance[a.size] ?? 0)) this.drop(a.x, a.y);
    });
    bus.on(EVENTS.BOSS_DESTROYED, ({ boss }) => {
      for (let i = 0; i < POWERUPS.bossDrops; i++) {
        const a = rand(0, TAU), r = boss.radius * 0.5;
        this.drop(boss.x + Math.cos(a) * r, boss.y + Math.sin(a) * r);
      }
    });
  }

  drop(x, y, weapon = pick(POWERUP_WEAPONS)) {
    if (!weapon) return null;
    const pickup = new Pickup(weapon, x, y);
    this.world.pickups.push(pickup);
    this.bus.emit(EVENTS.POWERUP_DROPPED, { pickup });
    return pickup;
  }

  update(dt, world) {
    for (const p of world.pickups) {
      p.update(dt, world.bounds);
      if (p.dead) continue;
      const ship = world.ships.find(s => s.alive && circlesOverlap(s, s.radius, p, p.radius));
      if (!ship) continue;
      p.expire();
      ship.grantPowerup(p.weapon, POWERUPS.duration);
      this.bus.emit(EVENTS.POWERUP_COLLECTED, { ship, pickup: p, weapon: p.weapon });
    }
    world.pickups = world.pickups.filter(p => !p.dead);
  }
}
