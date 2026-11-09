import { MENU_KEYS } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

export class PausedState {
  constructor({ input, bus, states }) {
    Object.assign(this, { input, bus, states });
  }

  update() {
    if (this.input.wasPressed(MENU_KEYS.pause)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('playing', { resume: true });
    } else if (this.input.wasPressed(MENU_KEYS.quit)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('lobby');
    }
  }
}
