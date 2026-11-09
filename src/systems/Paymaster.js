import { BOSS, RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Pays pilots for what they destroy. The money is spent in the shop between
// waves; Score (ScoreKeeper) and money are kept apart on purpose.
export class Paymaster {
  constructor(bus) {
    this.bus = bus;
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid, by }) => by && this.pay(by, asteroid.bounty));
    bus.on(EVENTS.BOSS_HIT, ({ by }) => by && this.pay(by, BOSS.hitBounty));
    bus.on(EVENTS.SHIP_DESTROYED, ({ ship, by }) => by && by !== ship && this.pay(by, RULES.killBounty));
  }

  pay(ship, amount) {
    if (!amount) return;
    ship.earn(amount);
    this.bus.emit(EVENTS.MONEY_EARNED, { ship, amount });
  }
}
