import { ASTEROID_TYPES } from '../../config.js';
import { rand, TAU } from '../../core/math.js';

export class Asteroid {
  constructor(size, x, y, speedScale = 1) {
    const type = ASTEROID_TYPES[size];
    const speed = rand(type.speed[0], type.speed[1]) * speedScale;
    const dir = rand(0, TAU);
    this.size = size;
    this.radius = type.radius;
    this.score = type.score;
    this.x = x; this.y = y;
    this.vx = Math.cos(dir) * speed;
    this.vy = Math.sin(dir) * speed;
    // orientation: yaw (in the play plane) plus two tumble axes for the 3D view
    this.angle = rand(0, TAU); this.spin = rand(-1.2, 1.2);
    this.tumbleX = rand(0, TAU); this.tumbleXSpeed = rand(-1.2, 1.2);
    this.tumbleY = rand(0, TAU); this.tumbleYSpeed = rand(-1.2, 1.2);
  }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spin * dt;
    this.tumbleX += this.tumbleXSpeed * dt;
    this.tumbleY += this.tumbleYSpeed * dt;
    bounds.wrap(this);
  }

  // Two smaller rocks that inherit some momentum, or none for the smallest size.
  split(speedScale) {
    if (this.size <= 1) return [];
    return [0, 1].map(() => {
      const child = new Asteroid(this.size - 1, this.x, this.y, speedScale);
      child.vx += this.vx * 0.4;
      child.vy += this.vy * 0.4;
      return child;
    });
  }
}
