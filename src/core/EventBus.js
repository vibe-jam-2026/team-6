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
  SHIP_ROLLED: 'shipRolled',           // { ship, dir } a barrel roll started
  POWERUP_DROPPED: 'powerupDropped',   // { pickup }
  POWERUP_COLLECTED: 'powerupCollected', // { ship, pickup, weapon }
  POWERUP_EXPIRED: 'powerupExpired',   // { ship, weapon } the jet is back on rockets
  ASTEROID_DESTROYED: 'asteroidDestroyed', // { asteroid, by, inBlast }
  SHIP_DESTROYED: 'shipDestroyed',     // { ship, by, inBlast }
  SHIPS_BUMPED: 'shipsBumped',         // { a, b }
  EXTRA_LIFE: 'extraLife',             // { ship }
  WAVE_STARTED: 'waveStarted',         // { wave, boss }
  WAVE_CLEARED: 'waveCleared',         // { wave }
  SELF_DESTRUCT: 'selfDestruct',       // { ship, x, y } after everything in the blast is gone
  SHIELD_HIT: 'shieldHit',             // { ship, by }
  SHIELD_BLOCKED: 'shieldBlocked',     // { boss, x, y } a shot hit the Mothership's shield
  VICTORY: 'victory',                  // {} the final boss is down: the game is won
  FIREWORK_BURST: 'fireworkBurst',     // { x, y } a victory firework went off (screen pixels)
  UPGRADE_BOUGHT: 'upgradeBought',     // { ship, upgrade, price }
  PURCHASE_DENIED: 'purchaseDenied',   // { ship, reason: 'money' | 'maxed' }
  MONEY_EARNED: 'moneyEarned',         // { ship, amount }
  ENEMIES_RETREATED: 'enemiesRetreated', // { enemies } when a wave's time runs out
  ENEMY_HIT: 'enemyHit',               // { enemy, by } a hit that didn't destroy it
  ENEMY_FIRED: 'enemyFired',           // { enemy } a plane shot
  DRONE_LAUNCHED: 'droneLaunched',     // { from, drone } a zeppelin launched a drone
  BOSS_FIRED: 'bossFired',             // { boss }
  BOSS_HIT: 'bossHit',                 // { boss, by, x, y }
  BOSS_DESTROYED: 'bossDestroyed',     // { boss, by, inBlast }
  TEST_TOGGLED: 'testToggled',         // { invincible }
  MENU_ACTION: 'menuAction',           // {}
};
