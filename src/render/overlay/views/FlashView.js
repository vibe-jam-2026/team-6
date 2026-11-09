import { EVENTS } from '../../../core/EventBus.js';

const DURATION = 900; // ms

// A white flash over the whole screen when a ship self-destructs.
export class FlashView {
  #at = -Infinity;
  #pending = false;

  constructor(bus) {
    bus.on(EVENTS.SELF_DESTRUCT, () => { this.#pending = true; });
  }

  draw(o, { time }) {
    if (this.#pending) { this.#at = time; this.#pending = false; }
    const k = 1 - (time - this.#at) / DURATION;
    if (k <= 0) return;
    o.withAlpha(0.85 * k * k, () => o.fillScreen('#fff6e0'));
  }
}
