import { SHIP, RULES, BULLET } from '../../config.js';
import { Bullet } from './Bullet.js';

const FACING_UP = -Math.PI / 2;

export class Ship {
  radius = SHIP.radius;

  constructor(index, player, controller) {
    this.index = index;
    this.player = player;          // { name, color, ... }
    this.controller = controller;  // anything with read() -> { thrust, turn, fire }
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.angle = FACING_UP;
    this.bank = 0;                 // visual roll, eased towards the turn input
    this.alive = false;
    this.lives = RULES.lives;
    this.score = 0;
    this.kills = 0;
    this.nextLifeAt = RULES.extraLifeEvery;
    this.respawnTimer = 0.2 + index * 0.05;
    this.invulnerable = 0;
    this.cooldown = 0;
    this.thrusting = false;
    this.wantsToFire = false;
  }

  get name() { return this.player.name; }
  get color() { return this.player.color; }
  get inPlay() { return this.alive || this.lives > 0; }
  get isOut() { return !this.inPlay; }
  get vulnerable() { return this.alive && this.invulnerable <= 0; }

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
    this.lives--;
    this.respawnTimer = RULES.respawnDelay;
  }

  update(dt, bounds) {
    const c = this.controller.read();
    this.bank += (c.turn * 0.75 - this.bank) * Math.min(1, dt * 8);
    this.angle += c.turn * SHIP.turnSpeed * dt;
    this.thrusting = c.thrust;
    this.wantsToFire = c.fire;
    if (c.thrust) {
      this.vx += Math.cos(this.angle) * SHIP.thrust * dt;
      this.vy += Math.sin(this.angle) * SHIP.thrust * dt;
    }
    const decay = Math.exp(-SHIP.drag * dt);
    this.vx *= decay; this.vy *= decay;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > SHIP.maxSpeed) { this.vx *= SHIP.maxSpeed / speed; this.vy *= SHIP.maxSpeed / speed; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    bounds.wrap(this);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.cooldown -= dt;
  }

  // Returns a new Bullet if the trigger is held and the gun is ready, else null.
  tryFire(bulletsInFlight) {
    if (!this.wantsToFire || this.cooldown > 0 || bulletsInFlight >= SHIP.maxBullets) return null;
    this.cooldown = SHIP.fireCooldown;
    const nx = Math.cos(this.angle), ny = Math.sin(this.angle);
    return new Bullet(this,
      this.x + nx * SHIP.muzzleOffset, this.y + ny * SHIP.muzzleOffset,
      this.vx + nx * BULLET.speed, this.vy + ny * BULLET.speed);
  }
}
