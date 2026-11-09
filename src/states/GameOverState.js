import { MENU_KEYS } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

export class GameOverState {
  constructor({ input, bus, world, effects, states }) {
    Object.assign(this, { input, bus, world, effects, states });
  }

  update(dt) {
    if (this.input.wasPressed(MENU_KEYS.start)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('lobby');
      return;
    }
    this.world.updateAsteroids(dt);
    this.effects.update(dt, this.world);
  }
}
