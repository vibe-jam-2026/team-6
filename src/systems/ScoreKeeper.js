import { BOSS, RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Awards points for destruction events and grants extra lives.
export class ScoreKeeper {
  constructor(bus) {
    this.bus = bus;
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid, by }) => by && this.award(by, asteroid.score));
    bus.on(EVENTS.BOSS_HIT, ({ boss, by }) => by && this.award(by, boss.hitScore ?? BOSS.hitScore));
    bus.on(EVENTS.BOSS_DESTROYED, ({ boss, by }) => by && this.award(by, boss.killScore ?? BOSS.killScore));
    bus.on(EVENTS.SHIP_DESTROYED, ({ ship, by }) => {
      if (!by || by === ship) return;
      by.kills++;
      this.award(by, RULES.killScore);
    });
  }

  award(ship, points) {
    ship.score += points;
    while (ship.score >= ship.nextLifeAt) {
      ship.lives++;
      ship.nextLifeAt += RULES.extraLifeEvery;
      this.bus.emit(EVENTS.EXTRA_LIFE, { ship });
    }
  }
}
