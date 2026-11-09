import { BULLET } from '../../config.js';

export class Bullet {
  // hostile bullets come from the boss: they hit every ship and pass through rocks
  constructor(owner, x, y, vx, vy, { life = BULLET.life, radius = BULLET.radius, hostile = false, weapon = null } = {}) {
    this.owner = owner;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life;
    this.radius = radius;
    this.hostile = hostile;
    this.weapon = weapon; // the ship weapon that fired it (null for the boss)
  }

  get dead() { return this.life <= 0; }

  expire() { this.life = 0; }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    // the boss's bullets leave the arena instead of wrapping round to surprise someone
    if (this.hostile && (this.x < 0 || this.y < 0 || this.x >= bounds.width || this.y >= bounds.height)) this.expire();
    else bounds.wrap(this);
  }
}
