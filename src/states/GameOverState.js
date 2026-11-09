import { MENU_KEYS, DEMO } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

export class GameOverState {
  #demoTimer = 0;

  constructor({ input, bus, world, effects, states, session }) {
    Object.assign(this, { input, bus, world, effects, states, session });
  }

  enter() { this.#demoTimer = DEMO.resultsTime; }

  update(dt) {
    // a demo shows the results for a moment, then flies the next match
    if (this.session?.demo && (this.#demoTimer -= dt) <= 0) {
      this.states.change('playing');
      return;
    }
    if (this.input.wasPressed(MENU_KEYS.start)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('lobby');
      return;
    }
    this.world.updateAsteroids(dt);
    this.effects.update(dt, this.world);
  }
}
