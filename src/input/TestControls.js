import { RULES, TEST_KEYS, WAVES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Shortcuts for testing: toggle invincibility, jump between waves and hand out
// money. In the lobby a wave key starts the match straight at that wave.
export class TestControls {
  constructor({ input, bus, session, waves, world, states, keys = TEST_KEYS }) {
    Object.assign(this, { input, bus, session, waves, world, states, keys });
  }

  update() {
    const { input, keys, states } = this;
    if (input.wasPressed(keys.invincible)) this.#toggleInvincible();
    if (input.wasPressed(keys.addMoney) && states.currentName !== 'lobby') {
      this.addMoney(RULES.devMoney);
      this.session.announce(`+$${RULES.devMoney} · TESTING`, 1.5);
      this.bus.emit(EVENTS.MENU_ACTION);
    }

    const target = this.#requestedWave();
    if (target !== null) this.goToWave(target);
  }

  // Jumps the match to `wave` (from the lobby it starts the match there).
  // Returns false when that can't happen right now (e.g. paused or in the shop).
  goToWave(target) {
    const { states } = this;
    if (states.currentName === 'lobby') {
      if (this.session.joinedCount === 0) return false;
      states.change('playing');
    } else if (states.currentName !== 'playing') {
      return false;
    }
    this.waves.jumpTo(target, this.world);
    this.bus.emit(EVENTS.MENU_ACTION);
    return true;
  }

  // Gives money to one player (by index, 0 = P1) or to every ship in the match.
  // Also reachable from the browser console as game.addMoney(amount, player).
  addMoney(amount = RULES.devMoney, player = null) {
    const ships = this.world.ships.filter(s => player === null || s.index === player);
    for (const s of ships) s.earn(amount);
    return ships.map(s => `${s.name}: $${s.money}`).join(', ') || 'no ships in play';
  }

  // Turns invincibility on (never off), e.g. from the "fuska" voice command.
  makeInvincible() {
    if (!this.session.invincible) this.#toggleInvincible();
  }

  #toggleInvincible() {
    this.session.toggleInvincible();
    const on = this.session.invincible;
    this.bus.emit(EVENTS.TEST_TOGGLED, { invincible: on });
    this.session.announce(on ? 'INVINCIBLE ON' : 'INVINCIBLE OFF', 1.5);
  }

  // the wave a key asks for, or null
  #requestedWave() {
    const { input, keys, waves } = this;
    const digit = keys.waves.findIndex(k => input.wasPressed(k));
    if (digit >= 0) return Math.min(WAVES.final, digit + 1);
    // in the lobby the current wave is stale, so count from the start
    const current = this.states.currentName === 'playing' ? waves.wave : 0;
    if (input.wasPressed(keys.nextWave)) return Math.min(WAVES.final, current + 1);
    if (input.wasPressed(keys.nextBoss)) return waves.bossWaveAfter(current);
    return null;
  }
}
