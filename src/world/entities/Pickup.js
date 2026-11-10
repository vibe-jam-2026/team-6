import { POWERUPS } from '../../config.js';
import { rand, TAU } from '../../core/math.js';

// A weapon crate dropped by a shot-down enemy. It drifts slowly, wraps round
// the arena like everything else and vanishes if nobody grabs it in time.
export class Pickup {
  radius = POWERUPS.radius;

  constructor(weapon, x, y) {
    this.weapon = weapon;
    this.x = x; this.y = y;
    const a = rand(0, TAU), speed = rand(0.4, 1) * POWERUPS.drift;
    this.vx = Math.cos(a) * speed; this.vy = Math.sin(a) * speed;
    this.life = POWERUPS.life;
    this.age = 0;
  }

  get dead() { return this.life <= 0; }
  get color() { return this.weapon.color; }

  // 0..1 of its life left, for blinking near the end
  get remaining() { return Math.max(0, this.life / POWERUPS.life); }

  expire() { this.life = 0; }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.age += dt;
    bounds.wrap(this);
  }
}
