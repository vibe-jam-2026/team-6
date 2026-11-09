import { BULLET } from '../../config.js';

export class Bullet {
  radius = BULLET.radius;

  constructor(owner, x, y, vx, vy, life = BULLET.life) {
    this.owner = owner;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life;
  }

  get dead() { return this.life <= 0; }

  expire() { this.life = 0; }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    bounds.wrap(this);
  }
}
