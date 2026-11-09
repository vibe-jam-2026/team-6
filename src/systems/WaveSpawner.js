import { RULES } from '../config.js';
import { dist2, rand } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';
import { Asteroid } from '../world/entities/Asteroid.js';

const EDGE_BAND = 60;
const SAFE_DISTANCE = 200;

// Sends a new, larger and faster wave of rocks whenever the field is clear.
export class WaveSpawner {
  wave = 0;
  #timer = 0;

  constructor(bus) {
    this.bus = bus;
  }

  reset() {
    this.wave = 0;
    this.#timer = 0;
  }

  update(dt, world) {
    if (world.asteroids.length > 0) return;
    this.#timer += dt;
    if (this.#timer > RULES.waveDelay) this.startNext(world);
  }

  startNext(world) {
    this.#timer = 0;
    this.wave++;
    world.speedScale = 1 + this.wave * RULES.speedGrowthPerWave;
    const count = Math.min(3 + this.wave + Math.floor(world.ships.length / 2), RULES.maxWaveSize);
    for (let i = 0; i < count; i++) {
      const p = this.#edgePoint(world);
      world.asteroids.push(new Asteroid(3, p.x, p.y, world.speedScale));
    }
    this.bus.emit(EVENTS.WAVE_STARTED, { wave: this.wave });
  }

  // a point near the arena edge that is not right on top of a ship
  #edgePoint(world) {
    const { width: w, height: h } = world;
    let p;
    for (let tries = 0; tries < 30; tries++) {
      p = Math.random() < 0.5
        ? { x: rand(0, w), y: Math.random() < 0.5 ? rand(0, EDGE_BAND) : rand(h - EDGE_BAND, h) }
        : { x: Math.random() < 0.5 ? rand(0, EDGE_BAND) : rand(w - EDGE_BAND, w), y: rand(0, h) };
      if (!world.ships.some(s => s.alive && dist2(s, p) < SAFE_DISTANCE ** 2)) break;
    }
    return p;
  }
}
