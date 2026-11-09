import { TEST_KEYS } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Shortcuts for testing: toggle invincibility and jump between waves.
// In the lobby a wave key starts the match straight at that wave.
export class TestControls {
  constructor({ input, bus, session, waves, world, states, keys = TEST_KEYS }) {
    Object.assign(this, { input, bus, session, waves, world, states, keys });
  }

  update() {
    const { input, keys, states } = this;
    if (input.wasPressed(keys.invincible)) this.#toggleInvincible();

    const target = this.#requestedWave();
    if (target === null) return;
    if (states.currentName === 'lobby') {
      if (this.session.joinedCount === 0) return;
      states.change('playing');
    } else if (states.currentName !== 'playing') {
      return;
    }
    this.waves.jumpTo(target, this.world);
    this.bus.emit(EVENTS.MENU_ACTION);
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
    if (digit >= 0) return digit + 1;
    // in the lobby the current wave is stale, so count from the start
    const current = this.states.currentName === 'playing' ? waves.wave : 0;
    if (input.wasPressed(keys.nextWave)) return current + 1;
    if (input.wasPressed(keys.nextBoss)) return waves.bossWaveAfter(current);
    return null;
  }
}
