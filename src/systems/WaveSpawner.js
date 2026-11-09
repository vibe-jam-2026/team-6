import { BOSS, RULES, WAVES } from '../config.js';
import { dist2, rand } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';
import { Asteroid } from '../world/entities/Asteroid.js';
import { Boss } from '../world/entities/Boss.js';

const EDGE_BAND = 60;
const SAFE_DISTANCE = 200;

// Runs the waves. A normal wave lasts WAVES.duration seconds: it opens with a
// group of enemies and keeps sending reinforcements from the edges, more and
// more often as the waves go on. The final wave (WAVES.final) is the boss
// fight and has no clock. update() reports when a timed wave is over; whoever
// runs the match decides what happens next (the shop) and calls startNext().
export class WaveSpawner {
  wave = 0;
  timeLeft = 0;      // seconds left in the current timed wave
  #spawnTimer = 0;

  constructor(bus) {
    this.bus = bus;
  }

  reset() {
    this.wave = 0;
    this.timeLeft = 0;
    this.#spawnTimer = 0;
  }

  get isFinalWave() { return this.wave >= WAVES.final; }
  get isTimed() { return !this.isBossWave(); }

  // true once a timed wave has run out of time
  update(dt, world) {
    if (!this.isTimed) return false;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) return true;
    this.#reinforce(dt, world);
    return false;
  }

  // the final wave is won once its boss is gone
  bossBeaten(world) { return this.isFinalWave && this.isBossWave() && !world.boss; }

  isBossWave(wave = this.wave) { return wave > 0 && wave % BOSS.every === 0; }

  // the first boss wave after `wave` (never past the final wave)
  bossWaveAfter(wave) { return Math.min(WAVES.final, (Math.floor(wave / BOSS.every) + 1) * BOSS.every); }

  // Testing aid: wipe the field and start wave `wave` straight away.
  jumpTo(wave, world) {
    world.clearField();
    this.wave = Math.max(0, Math.min(WAVES.final, wave) - 1);
    this.startNext(world);
  }

  startNext(world) {
    this.wave++;
    this.timeLeft = WAVES.duration;
    this.#spawnTimer = this.#interval();
    for (const ship of world.ships) ship.prepareForWave();
    world.speedScale = 1 + this.wave * RULES.speedGrowthPerWave;
    if (this.isBossWave()) return this.#spawnBoss(world);
    const count = Math.min(3 + this.wave + Math.floor(world.ships.length / 2), RULES.maxWaveSize);
    this.#spawn(world, count);
    this.bus.emit(EVENTS.WAVE_STARTED, { wave: this.wave, boss: false });
  }

  // Reinforcements on a timer, sooner if the field is empty, never in the
  // last seconds and never past the enemy cap.
  #reinforce(dt, world) {
    this.#spawnTimer -= dt;
    const due = this.#spawnTimer <= 0 || world.asteroids.length === 0;
    if (!due || this.timeLeft < WAVES.quietEnd || world.asteroids.length >= WAVES.maxEnemies) return;
    this.#spawnTimer = this.#interval();
    this.#spawn(world, 1 + Math.floor(this.wave * WAVES.groupPerWave));
  }

  #interval() {
    return Math.max(WAVES.minInterval, WAVES.interval + (this.wave - 1) * WAVES.intervalPerWave);
  }

  #spawn(world, count) {
    for (let i = 0; i < count; i++) {
      const p = this.#edgePoint(world);
      world.asteroids.push(new Asteroid(3, p.x, p.y, world.speedScale));
    }
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
