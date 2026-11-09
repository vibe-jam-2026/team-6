import { EVENTS } from '../core/EventBus.js';

// Maps game events to sounds. Gameplay code never calls audio directly.
export class SoundEffects {
  constructor(bus, synth) {
    bus.on(EVENTS.SHOT_FIRED, ({ ship }) => synth.tone(880 + ship.index * 120, 220, 0.12, 'square', 0.07));
    bus.on(EVENTS.ASTEROID_DESTROYED, ({ asteroid: a, inBlast }) => !inBlast && synth.noise(0.25 + a.size * 0.18, 0.25 + a.size * 0.1, 400 + a.size * 500));
    bus.on(EVENTS.SHIP_DESTROYED, ({ inBlast }) => {
      if (inBlast) return;
      synth.noise(0.9, 0.55, 2400);
      synth.tone(180, 40, 0.7, 'sawtooth', 0.12);
    });
    bus.on(EVENTS.SHIPS_BUMPED, () => synth.tone(140, 90, 0.08, 'triangle', 0.12));
    bus.on(EVENTS.EXTRA_LIFE, () => [523, 659, 784, 1046].forEach((f, k) => synth.tone(f, f, 0.12, 'triangle', 0.12, k * 0.09)));
    bus.on(EVENTS.SELF_DESTRUCT, () => {
      synth.noise(2.6, 0.9, 3200);
      synth.noise(1.4, 0.6, 900);
      synth.tone(220, 25, 2.2, 'sawtooth', 0.22);
      synth.tone(110, 18, 2.6, 'square', 0.16, 0.05);
    });
    bus.on(EVENTS.SHIELD_HIT, () => synth.tone(1200, 300, 0.25, 'sine', 0.14));
    bus.on(EVENTS.WAVE_CLEARED, () => [392, 523, 659].forEach((f, k) => synth.tone(f, f, 0.14, 'triangle', 0.1, k * 0.08)));
    bus.on(EVENTS.UPGRADE_CHOSEN, ({ ship }) => [660, 990].forEach((f, k) => synth.tone(f + ship.index * 40, f * 1.5, 0.12, 'square', 0.07, k * 0.07)));
    bus.on(EVENTS.WAVE_STARTED, ({ boss }) => {
      if (boss) for (let k = 0; k < 3; k++) synth.tone(440, 220, 0.4, 'sawtooth', 0.09, k * 0.45);
    });
    bus.on(EVENTS.BOSS_FIRED, () => synth.tone(200, 90, 0.18, 'square', 0.05));
    bus.on(EVENTS.BOSS_HIT, () => synth.tone(1400, 700, 0.05, 'triangle', 0.06));
    bus.on(EVENTS.BOSS_DESTROYED, ({ inBlast }) => {
      if (inBlast) return;
      synth.noise(2.2, 0.7, 3000);
      [392, 330, 262, 196].forEach((f, k) => synth.tone(f, f / 2, 0.5, 'sawtooth', 0.12, k * 0.18));
    });
    bus.on(EVENTS.TEST_TOGGLED, ({ invincible }) => synth.tone(invincible ? 440 : 880, invincible ? 880 : 440, 0.15, 'triangle', 0.1));
    bus.on(EVENTS.MENU_ACTION, () => synth.tone(660, 660, 0.06, 'triangle', 0.1));
  }
}
