import { SHIP, RULES, BULLET, SPREAD_ANGLE, WEAPONS, ROLL } from '../../config.js';
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
    this.cooldowns = new Map();    // weapon id -> seconds until it can fire again
    this.thrusting = false;
    this.wantsToFire = false;
    this.autoFire = !controller.isComputer; // pilots' guns run on their own; the fire key toggles them
    this.stats = baseStats();
    this.upgrades = new Map();     // upgrade id -> level
    this.shieldCharges = 0;
    this.powerups = [];            // [{ weapon, time }]: weapons picked up from crates, in pickup order
    this.rollTime = 0;             // seconds left in a barrel roll
    this.rollDir = 0;              // -1 rolling left, 1 right
    this.rollCooldown = 0;
    this.justRolled = false;       // a roll started this step (for the sound)
  }

  // the guns that fire: every power-up held, or the standard gun when there are none
  get weapons() { return this.powerups.length ? this.powerups.map(p => p.weapon) : [WEAPONS[0]]; }
  // the newest gun (the computer pilot aims for it)
  get weapon() { return this.weapons.at(-1); }

  // Arms a power-up weapon for `duration` seconds alongside any others held;
  // one already held gets `duration` more, up to `maxTime`.
  grantPowerup(weapon, duration, maxTime = Infinity) {
    const held = this.powerups.find(p => p.weapon === weapon);
    if (held) held.time = Math.min(maxTime, held.time + duration);
    else this.powerups.push({ weapon, time: Math.min(maxTime, duration) });
  }

  clearPowerups() {
    this.powerups = [];
  }

  // Counts every power-up down; returns the weapons that ran out this step.
  tickPowerups(dt) {
    for (const p of this.powerups) p.time -= dt;
    const expired = this.powerups.filter(p => p.time <= 0).map(p => p.weapon);
    if (expired.length) this.powerups = this.powerups.filter(p => p.time > 0);
    return expired;
  }

  get name() { return this.player.name + (this.controller.isComputer ? ' CPU' : ''); }
  get color() { return this.player.color; }
  get inPlay() { return this.alive || this.lives > 0; }
  get isOut() { return !this.inPlay; }
  get rolling() { return this.rollTime > 0; }
  // 0..1 through the current roll (for the 3D spin)
  get rollProgress() { return this.rolling ? 1 - this.rollTime / ROLL.duration : 0; }
  // can't be hit while respawn-shielded or in the middle of a barrel roll
  get vulnerable() { return this.alive && this.invulnerable <= 0 && !this.rolling; }

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
    this.clearPowerups();
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
    Object.assign(this, { x, y, vx: 0, vy: 0, angle: FACING_UP, alive: true, invulnerable: RULES.invulnTime, rollTime: 0, rollCooldown: 0 });
    this.cooldowns.clear();
  }

  destroy() {
    this.alive = false;
    this.clearPowerups();
    this.lives--;
    this.respawnTimer = RULES.respawnDelay;
  }

  // out of the match for good, whatever lives were left
  eliminate() {
    this.alive = false;
    this.clearPowerups();
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
    this.justRolled = false;
    this.rollCooldown = Math.max(0, this.rollCooldown - dt);
    if (c.roll && !this.rolling && this.rollCooldown <= 0) {
      this.rollTime = ROLL.duration;
      this.rollDir = Math.sign(c.roll);
      this.rollCooldown = ROLL.duration + ROLL.cooldown;
      this.justRolled = true;
    }
    if (this.rolling) {
      // hop sideways: -1 to the jet's left, 1 to its right (y points down)
      const side = this.angle + this.rollDir * Math.PI / 2, step = ROLL.distance / ROLL.duration * Math.min(dt, this.rollTime);
      this.x += Math.cos(side) * step;
      this.y += Math.sin(side) * step;
      this.rollTime = Math.max(0, this.rollTime - dt);
    }
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
    for (const [id, t] of this.cooldowns) this.cooldowns.set(id, t - dt);
  }

  // Returns the bullets fired this step by every gun that is ready (several
  // with spread shot or stacked power-ups), or [] if the trigger is up.
  // inFlight(weapon) says how many of that gun's shots are in the air; each
  // gun cools down and is capped on its own.
  tryFire(inFlight = () => 0) {
    if (!this.wantsToFire) return [];
    return this.weapons.flatMap(w => this.#fireWeapon(w, inFlight(w)));
  }

  #fireWeapon(w, bulletsInFlight) {
    const st = this.stats;
    if ((this.cooldowns.get(w.id) ?? 0) > 0 || bulletsInFlight >= st.maxBullets + w.magazine) return [];
    this.cooldowns.set(w.id, st.fireCooldown * w.cooldown);
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
