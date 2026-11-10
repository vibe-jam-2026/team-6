import { EVENTS } from '../core/EventBus.js';

// Maps game events to sounds. Gameplay code never calls audio directly.
export class SoundEffects {
  constructor(bus, synth) {
    bus.on(EVENTS.SHOT_FIRED, ({ ship }) => synth.tone(880 + ship.index * 120, 220, 0.12, 'square', 0.07));
    bus.on(EVENTS.POWERUP_COLLECTED, ({ ship }) => [520, 780, 1040].forEach((f, k) => synth.tone(f + ship.index * 60, f * 1.2, 0.07, 'square', 0.07, k * 0.05)));
    bus.on(EVENTS.POWERUP_EXPIRED, ({ ship }) => [780, 520].forEach((f, k) => synth.tone(f + ship.index * 60, f * 0.8, 0.06, 'triangle', 0.05, k * 0.06)));
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
    bus.on(EVENTS.BULLETS_CLASHED, ({ enemyShot: e, destroyed }) => {
      if (!e.armoured) synth.tone(1600, 500, 0.06, 'square', 0.04);
      else if (!destroyed) synth.tone(420 + e.health * 300, 200, 0.09, 'square', 0.07);   // a dull clang, lower as it cracks
      else { synth.noise(0.35, 0.3, 1800); synth.tone(300, 80, 0.25, 'sawtooth', 0.08); }
    });
    bus.on(EVENTS.SHIELD_HIT, () => synth.tone(1200, 300, 0.25, 'sine', 0.14));
    bus.on(EVENTS.WAVE_CLEARED, () => [392, 523, 659].forEach((f, k) => synth.tone(f, f, 0.14, 'triangle', 0.1, k * 0.08)));
    bus.on(EVENTS.UPGRADE_BOUGHT, ({ ship }) => [660, 990, 1320].forEach((f, k) => synth.tone(f + ship.index * 40, f * 1.5, 0.1, 'square', 0.07, k * 0.06)));
    bus.on(EVENTS.PURCHASE_DENIED, () => synth.tone(150, 110, 0.18, 'sawtooth', 0.09));
    // victory: a fanfare, then a pop and crackle for every firework
    bus.on(EVENTS.VICTORY, () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, k) =>
      synth.tone(f, f, k < 4 ? 0.16 : 0.32, 'triangle', 0.13, k * 0.14 + (k > 3 ? 0.1 : 0))));
    bus.on(EVENTS.FIREWORK_BURST, () => {
      synth.noise(0.7, 0.3, 2600);
      for (let k = 0; k < 4; k++) synth.tone(2400 + k * 300, 1800, 0.03, 'square', 0.025, 0.12 + k * 0.07 + Math.random() * 0.05);
    });
    bus.on(EVENTS.SHIELD_BLOCKED, () => synth.tone(900, 1300, 0.06, 'sine', 0.06));
    bus.on(EVENTS.ENEMY_HIT, () => synth.tone(1100, 600, 0.05, 'triangle', 0.05));
    bus.on(EVENTS.ENEMY_FIRED, () => synth.tone(320, 160, 0.1, 'square', 0.03));
    bus.on(EVENTS.DRONE_LAUNCHED, () => synth.tone(500, 1000, 0.12, 'sine', 0.04));
    bus.on(EVENTS.ENEMIES_RETREATED, () => synth.tone(300, 900, 0.5, 'sine', 0.08));
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
