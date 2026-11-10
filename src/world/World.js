import { EVENTS } from '../core/EventBus.js';

// Owns the entities in play and the two ways things get destroyed.
// Destruction is announced on the bus; scoring, sound and effects listen.
export class World {
  ships = [];
  asteroids = [];
  bullets = [];
  boss = null;
  groundTargets = []; // AA guns on the ground (see GroundTarget)
  speedScale = 1; // set by the wave spawner, applied to new rocks

  constructor(bounds, bus) {
    this.bounds = bounds;
    this.bus = bus;
  }

  reset(ships = []) {
    this.ships = ships;
    this.asteroids = [];
    this.bullets = [];
    this.boss = null;
    this.groundTargets = [];
    this.speedScale = 1;
  }

  // When a wave's time is up the enemies still flying turn back: no score,
  // no money, just gone (effects can show them leaving).
  retreatEnemies() {
    const leaving = [...this.asteroids, ...this.groundTargets];
    this.asteroids = [];
    this.groundTargets = [];
    this.bullets = [];
    if (leaving.length) this.bus.emit(EVENTS.ENEMIES_RETREATED, { enemies: leaving });
  }

  // removes everything hostile: rocks, the boss and its bullets (used when jumping waves)
  clearField() {
    this.asteroids = [];
    this.groundTargets = [];
    this.boss = null;
    this.bullets = [];
  }

  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }

  updateAsteroids(dt) {
    for (const a of this.asteroids) a.update(dt, this.bounds);
  }

  // A bullet lands on an enemy: tougher types (planes, zeppelins) take a few hits.
  hitEnemy(enemy, by = null, damage = 1) {
    if (!this.asteroids.includes(enemy)) return;
    if (enemy.takeHit(damage)) this.destroyAsteroid(enemy, by);
    else this.bus.emit(EVENTS.ENEMY_HIT, { enemy, by });
  }

  // A shot lands on a ground gun. It reports through the same events as the
  // flying enemies, so it scores, pays and explodes like one.
  hitGroundTarget(target, by = null, damage = 1) {
    const i = this.groundTargets.indexOf(target);
    if (i < 0) return;
    if (!target.takeHit(damage)) {
      this.bus.emit(EVENTS.ENEMY_HIT, { enemy: target, by });
      return;
    }
    this.groundTargets.splice(i, 1);
    this.bus.emit(EVENTS.ASTEROID_DESTROYED, { asteroid: target, by });
  }

  // gone for good: enemies no longer split into smaller ones
  destroyAsteroid(asteroid, by = null) {
    const i = this.asteroids.indexOf(asteroid);
    if (i < 0) return;
    this.asteroids.splice(i, 1);
    asteroid.hp = 0;
    this.bus.emit(EVENTS.ASTEROID_DESTROYED, { asteroid, by });
  }

  hitBoss(by, at) {
    const boss = this.boss;
    if (!boss?.vulnerable) return;
    boss.takeHit(at.weapon?.damage ?? 1);
    this.bus.emit(EVENTS.BOSS_HIT, { boss, by, x: at.x, y: at.y });
    if (boss.alive) return;
    this.boss = null;
    for (const b of this.bullets) if (b.hostile) b.expire();
    this.bus.emit(EVENTS.BOSS_DESTROYED, { boss, by });
  }

  // force: ignore the deflector (a self-destruct blast); inBlast: part of one
  destroyShip(ship, by = null, { force = false, inBlast = false } = {}) {
    if (!ship.alive) return;
    if (!force && ship.absorbHit()) {
      this.bus.emit(EVENTS.SHIELD_HIT, { ship, by });
      return;
    }
    ship.destroy();
    this.bus.emit(EVENTS.SHIP_DESTROYED, { ship, by, inBlast });
  }

  // the boss caught in a self-destruct blast, whatever health it had left
  obliterateBoss(by = null) {
    const boss = this.boss;
    if (!boss) return;
    this.boss = null;
    this.bus.emit(EVENTS.BOSS_DESTROYED, { boss, by, inBlast: true });
  }

  // caught in a self-destruct blast
  obliterateAsteroid(asteroid, by = null) {
    const i = this.asteroids.indexOf(asteroid);
    if (i < 0) return;
    this.asteroids.splice(i, 1);
    this.bus.emit(EVENTS.ASTEROID_DESTROYED, { asteroid, by, inBlast: true });
  }
}
