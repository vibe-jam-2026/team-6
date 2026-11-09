import { BOSS, RULES } from '../config.js';
import { dist2, rand } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';
import { Asteroid } from '../world/entities/Asteroid.js';
import { Boss } from '../world/entities/Boss.js';

const EDGE_BAND = 60;
const SAFE_DISTANCE = 200;

// Sends a new, larger and faster wave of rocks. Every BOSS.every-th wave
// (5, 10, ...) is a boss fight instead. update() reports when the field has
// been clear for a moment; whoever runs the match decides when to call startNext().
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

  // true once the current wave is cleared and the next one may start
  update(dt, world) {
    if (world.asteroids.length > 0 || world.boss) return false;
    this.#timer += dt;
    return this.#timer > RULES.waveDelay;
  }

  isBossWave(wave = this.wave) { return wave > 0 && wave % BOSS.every === 0; }

  // the first boss wave after `wave`
  bossWaveAfter(wave) { return (Math.floor(wave / BOSS.every) + 1) * BOSS.every; }

  // Testing aid: wipe the field and start wave `wave` straight away.
  jumpTo(wave, world) {
    world.clearField();
    this.wave = Math.max(0, wave - 1);
    this.startNext(world);
  }

  startNext(world) {
    this.#timer = 0;
    this.wave++;
    for (const ship of world.ships) ship.prepareForWave();
    world.speedScale = 1 + this.wave * RULES.speedGrowthPerWave;
    if (this.isBossWave()) return this.#spawnBoss(world);
    const count = Math.min(3 + this.wave + Math.floor(world.ships.length / 2), RULES.maxWaveSize);
    for (let i = 0; i < count; i++) {
      const p = this.#edgePoint(world);
      world.asteroids.push(new Asteroid(3, p.x, p.y, world.speedScale));
    }
    this.bus.emit(EVENTS.WAVE_STARTED, { wave: this.wave, boss: false });
  }

  #spawnBoss(world) {
    const level = this.wave / BOSS.every;
    const pilots = Math.max(1, world.ships.length);
    const hp = Math.round((BOSS.baseHp + BOSS.hpPerShip * (pilots - 1)) * (1 + BOSS.hpGrowth * (level - 1)));
    const p = this.#bossPoint(world);
    world.boss = new Boss(p.x, p.y, hp, level);
    this.bus.emit(EVENTS.WAVE_STARTED, { wave: this.wave, boss: true });
  }

  // the candidate spot furthest from every living ship
  #bossPoint(world) {
    const { width: w, height: h } = world;
    const candidates = [[0.5, 0.5], [0.5, 0.25], [0.5, 0.75], [0.25, 0.5], [0.75, 0.5]].map(([x, y]) => ({ x: x * w, y: y * h }));
    const clearance = p => Math.min(Infinity, ...world.ships.filter(s => s.alive).map(s => dist2(s, p)));
    return candidates.reduce((best, c) => clearance(c) > clearance(best) ? c : best);
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
