import { EVENTS } from '../core/EventBus.js';

// Maps game events to sounds. Gameplay code never calls audio directly.
export class SoundEffects {
  constructor(bus, synth) {
    bus.on(EVENTS.SHOT_FIRED, ({ ship }) => synth.tone(880 + ship.index * 120, 220, 0.12, 'square', 0.07));
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid: a }) => synth.noise(0.25 + a.size * 0.18, 0.25 + a.size * 0.1, 400 + a.size * 500));
    bus.on(EVENTS.SHIP_DESTROYED, () => {
      synth.noise(0.9, 0.55, 2400);
      synth.tone(180, 40, 0.7, 'sawtooth', 0.12);
    });
    bus.on(EVENTS.SHIPS_BUMPED, () => synth.tone(140, 90, 0.08, 'triangle', 0.12));
    bus.on(EVENTS.EXTRA_LIFE, () => [523, 659, 784, 1046].forEach((f, k) => synth.tone(f, f, 0.12, 'triangle', 0.12, k * 0.09)));
    bus.on(EVENTS.MENU_ACTION, () => synth.tone(660, 660, 0.06, 'triangle', 0.1));
  }
}
