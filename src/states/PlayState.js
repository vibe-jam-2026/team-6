import { MENU_KEYS, RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// The match itself: runs the systems in order and watches for the end.
export class PlayState {
  #overTimer = null;

  constructor({ input, bus, world, session, waves, effects, states, systems }) {
    Object.assign(this, { input, bus, world, session, waves, effects, states, systems });
  }

  enter({ resume = false } = {}) {
    if (resume) return;
    this.world.reset(this.session.createShips());
    this.waves.reset();
    this.waves.startNext(this.world);
    this.#overTimer = null;
  }

  update(dt) {
    if (this.input.wasPressed(MENU_KEYS.pause)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('paused');
      return;
    }
    const { world, session, systems } = this;
    systems.ships.update(dt, world);
    systems.bullets.update(dt, world, session.mode);
    world.updateAsteroids(dt);
    systems.boss.update(dt, world);
    systems.selfDestruct.update(world, session.mode);
    systems.collisions.update(world, session.mode, { invincible: session.invincible });
    systems.bullets.removeSpent(world);
    this.effects.update(dt, world);
    const waveCleared = this.waves.update(dt, world);
    session.tickBanner(dt);
    if (this.#checkGameOver(dt)) return;
    if (waveCleared) {
      this.bus.emit(EVENTS.WAVE_CLEARED, { wave: this.waves.wave });
      this.states.change('upgrade');
    }
  }

  // true while the match is ending (so no upgrade screen interrupts it)
  #checkGameOver(dt) {
    if (!this.session.mode.isOver(this.world.ships)) return false;
    // let the last explosion play out for a moment
    this.#overTimer ??= RULES.gameOverDelay;
    this.#overTimer -= dt;
    if (this.#overTimer > 0) return true;
    this.session.finish(this.world.ships, this.waves.wave);
    this.states.change('gameover');
    return true;
  }
}
