// Minimal publish/subscribe hub. Gameplay code announces what happened;
// sound, effects, scoring and camera react without the gameplay knowing them.
export class EventBus {
  #handlers = new Map();

  on(type, handler) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(handler);
    return () => this.#handlers.get(type).delete(handler);
  }

  emit(type, payload = {}) {
    const set = this.#handlers.get(type);
    if (set) for (const handler of set) handler(payload);
  }
}

// Event names used across the game, kept in one place.
export const EVENTS = {
  SHOT_FIRED: 'shotFired',             // { ship }
  ASTEROID_DESTROYED: 'asteroidDestroyed', // { asteroid, by }
  SHIP_DESTROYED: 'shipDestroyed',     // { ship, by }
  SHIPS_BUMPED: 'shipsBumped',         // { a, b }
  EXTRA_LIFE: 'extraLife',             // { ship }
  WAVE_STARTED: 'waveStarted',         // { wave, boss }
  BOSS_FIRED: 'bossFired',             // { boss }
  BOSS_HIT: 'bossHit',                 // { boss, by, x, y }
  BOSS_DESTROYED: 'bossDestroyed',     // { boss, by }
  TEST_TOGGLED: 'testToggled',         // { invincible }
  MENU_ACTION: 'menuAction',           // {}
};
