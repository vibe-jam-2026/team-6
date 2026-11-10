import { BULLET } from '../../config.js';

export class Bullet {
  // hostile bullets come from the boss: they hit every ship and pass through rocks
  constructor(owner, x, y, vx, vy, { life = BULLET.life, radius = BULLET.radius, hostile = false, weapon = null, hp = 1 } = {}) {
    this.owner = owner;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life;
    this.radius = radius;
    this.hostile = hostile;
    this.weapon = weapon; // the ship weapon that fired it (null for the boss)
    this.target = null;   // what a homing missile is chasing
    this.hp = hp;         // shots it takes to stop (the Mothership's heavy shells take several)
    this.maxHp = hp;
    this.hitFlash = 0;    // 1 right after taking a hit that didn't stop it, fading to 0
  }

  get armoured() { return this.maxHp > 1; }
  get health() { return this.hp / this.maxHp; }

  // A player shot lands on it; true if that stopped it.
  takeHit(damage = 1) {
    this.hp -= damage;
    if (this.hp <= 0) { this.expire(); return true; }
    this.hitFlash = 1;
    return false;
  }

  get dead() { return this.life <= 0; }

  expire() { this.life = 0; }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    // the boss's bullets leave the arena instead of wrapping round to surprise someone
    if (this.hostile && (this.x < 0 || this.y < 0 || this.x >= bounds.width || this.y >= bounds.height)) this.expire();
    else bounds.wrap(this);
  }
}
