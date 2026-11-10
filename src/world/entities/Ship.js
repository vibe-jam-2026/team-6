import { SHIP, RULES, BULLET, SPREAD_ANGLE, WEAPONS } from '../../config.js';
import { Bullet } from './Bullet.js';

const FACING_UP = -Math.PI / 2;

// the per-ship numbers that upgrades are allowed to change
const baseStats = () => ({
  turnSpeed: SHIP.turnSpeed,
  thrust: SHIP.thrust,
  maxSpeed: SHIP.maxSpeed,
  fireCooldown: SHIP.fireCooldown,
  maxBullets: SHIP.maxBullets,
  bulletSpeed: BULLET.speed,
  bulletLife: BULLET.life,
  shots: 1,
  shieldCapacity: 0,
});

export class Ship {
  radius = SHIP.radius;

  constructor(index, player, controller) {
    this.index = index;
    this.player = player;          // { name, color, ... }
    this.controller = controller;  // anything with read(ship) -> { thrust, turn, fire, toggleFire }
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.angle = FACING_UP;
    this.bank = 0;                 // visual roll, eased towards the turn input
    this.alive = false;
    this.lives = RULES.lives;
    this.score = 0;
    this.money = RULES.startMoney ?? 0; // earned from enemies, spent in the shop
    this.kills = 0;
    this.nextLifeAt = RULES.extraLifeEvery;
    this.respawnTimer = 0.2 + index * 0.05;
    this.invulnerable = 0;
    this.cooldown = 0;
    this.thrusting = false;
    this.wantsToFire = false;
    this.autoFire = !controller.isComputer; // pilots' guns run on their own; the fire key toggles them
    this.stats = baseStats();
    this.upgrades = new Map();     // upgrade id -> level
    this.shieldCharges = 0;
    this.powerup = null;           // a weapon picked up from a crate, while it lasts
    this.powerupTime = 0;          // seconds left on it
  }

  // the standard gun, or the power-up weapon while one is armed
  get weapon() { return this.powerup ?? WEAPONS[0]; }

  // arms a power-up weapon for `duration` seconds (replacing any current one)
  grantPowerup(weapon, duration) {
    this.powerup = weapon;
    this.powerupTime = duration;
  }

  clearPowerup() {
    this.powerup = null;
    this.powerupTime = 0;
  }

  // Counts the power-up down; true on the step it runs out.
  tickPowerup(dt) {
    if (!this.powerup) return false;
    this.powerupTime -= dt;
    if (this.powerupTime > 0) return false;
    this.clearPowerup();
    return true;
  }

  get name() { return this.player.name + (this.controller.isComputer ? ' CPU' : ''); }
  get color() { return this.player.color; }
  get inPlay() { return this.alive || this.lives > 0; }
  get isOut() { return !this.inPlay; }
  get vulnerable() { return this.alive && this.invulnerable <= 0; }

  upgradeLevel(id) { return this.upgrades.get(id) ?? 0; }

  earn(amount) { this.money += amount; }
  spend(amount) { this.money -= amount; }

  applyUpgrade(upgrade) {
    upgrade.apply(this);
    this.upgrades.set(upgrade.id, this.upgradeLevel(upgrade.id) + 1);
  }

  // called as each wave begins: the deflector recharges
  prepareForWave() {
    this.shieldCharges = this.stats.shieldCapacity;
    this.clearPowerup();
  }

  // The deflector soaks up a hit if it has charge left; true if it did.
  absorbHit() {
    if (this.shieldCharges <= 0) return false;
    this.shieldCharges--;
    this.invulnerable = Math.max(this.invulnerable, RULES.shieldHitInvuln);
    return true;
  }

  // Counts down while dead; true when it is time to come back.
  tickRespawn(dt) {
    if (this.alive || this.lives <= 0) return false;
    this.respawnTimer -= dt;
    return this.respawnTimer <= 0;
  }

  spawnAt({ x, y }) {
    Object.assign(this, { x, y, vx: 0, vy: 0, angle: FACING_UP, alive: true, invulnerable: RULES.invulnTime, cooldown: 0 });
  }

  destroy() {
    this.alive = false;
    this.clearPowerup();
    this.lives--;
    this.respawnTimer = RULES.respawnDelay;
  }

  // out of the match for good, whatever lives were left
  eliminate() {
    this.alive = false;
    this.clearPowerup();
    this.lives = 0;
  }

  update(dt, bounds) {
    const c = this.controller.read(this);
    this.bank += (c.turn * 0.75 - this.bank) * Math.min(1, dt * 8);
    const st = this.stats;
    this.angle += c.turn * st.turnSpeed * dt;
    this.thrusting = c.thrust;
    if (c.toggleFire) this.autoFire = !this.autoFire;
    this.wantsToFire = this.autoFire || !!c.fire;
    if (c.thrust) {
      this.vx += Math.cos(this.angle) * st.thrust * dt;
      this.vy += Math.sin(this.angle) * st.thrust * dt;
    }
    const decay = Math.exp(-SHIP.drag * dt);
    this.vx *= decay; this.vy *= decay;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > st.maxSpeed) { this.vx *= st.maxSpeed / speed; this.vy *= st.maxSpeed / speed; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    bounds.wrap(this);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.cooldown -= dt;
  }

  // Returns the bullets fired this step (several with spread shot), or [] if
  // the trigger is up, the gun is cooling down or too many shots are in the air.
  tryFire(bulletsInFlight) {
    const st = this.stats, w = this.weapon;
    if (!this.wantsToFire || this.cooldown > 0 || bulletsInFlight >= st.maxBullets + w.magazine) return [];
    this.cooldown = st.fireCooldown * w.cooldown;
    const shots = st.shots + w.shots, speed = st.bulletSpeed * w.speed, spread = SPREAD_ANGLE * w.spread;
    const bullets = [];
    for (let k = 0; k < shots; k++) {
      const a = this.angle + (k - (shots - 1) / 2) * spread;
      const nx = Math.cos(a), ny = Math.sin(a);
      bullets.push(new Bullet(this,
        this.x + nx * SHIP.muzzleOffset, this.y + ny * SHIP.muzzleOffset,
        this.vx + nx * speed, this.vy + ny * speed, { life: st.bulletLife * w.life, weapon: w }));
    }
    return bullets;
  }
}
