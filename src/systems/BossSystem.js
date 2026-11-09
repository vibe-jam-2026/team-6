import { EVENTS } from '../core/EventBus.js';

// Runs the boss (if there is one) and puts the bullets it fires into the world.
export class BossSystem {
  constructor(bus) {
    this.bus = bus;
  }

  update(dt, world) {
    const boss = world.boss;
    if (!boss) return;
    const shots = boss.update(dt, world);
    // the Mothership also launches fighters
    for (const fighter of boss.drainLaunches?.() ?? []) {
      world.asteroids.push(fighter);
      this.bus.emit(EVENTS.DRONE_LAUNCHED, { from: boss, drone: fighter });
    }
    if (shots.length === 0) return;
    world.bullets.push(...shots);
    this.bus.emit(EVENTS.BOSS_FIRED, { boss, count: shots.length });
  }
}
