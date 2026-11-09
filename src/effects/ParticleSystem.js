import { rand, TAU } from '../core/math.js';

// Short-lived visual sparks. Pure data; the renderer decides how they look.
export class ParticleSystem {
  particles = [];

  burst(x, y, color, count, speed, life) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), sp = rand(speed * 0.2, speed);
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(-0.7, 0.9) * sp, life: rand(life * 0.4, life), max: life, color });
    }
  }

  add({ x, y, z = 0, vx, vy, vz = 0, life, max = life, color }) {
    this.particles.push({ x, y, z, vx, vy, vz, life, max, color });
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vx *= 0.985; p.vy *= 0.985; p.vz *= 0.985;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }
}
