import { BOSS, ENEMY_MIX, MOTHERSHIP, RULES, WAVES } from '../config.js';
import { dist2, rand } from '../core/math.js';
import { EVENTS } from '../core/EventBus.js';
import { Asteroid } from '../world/entities/Asteroid.js';
import { Boss } from '../world/entities/Boss.js';
import { Mothership } from '../world/entities/Mothership.js';

const EDGE_BAND = 60;
const SAFE_DISTANCE = 200;

// Runs the waves. A normal wave lasts WAVES.duration seconds: it opens with a
// group of enemies and keeps sending reinforcements from the edges, more and
// more often as the waves go on. Boss waves have no clock: a mid-game boss
// (wave 5) ends its wave when it falls; the final wave (WAVES.final) brings
// the Mothership. update() reports when a wave is over; whoever runs the
// match decides what happens next (the shop) and calls startNext().
export class WaveSpawner {
  wave = 0;
  timeLeft = 0;      // seconds left in the current timed wave
  #spawnTimer = 0;
  #bossClear = 0;    // counts down after a mid-game boss falls

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

  // true once a timed wave has run out of time, or a mid-game boss has fallen
  // (after a moment for its explosion); never for the final wave
  update(dt, world) {
    if (!this.isTimed) {
      if (this.isFinalWave || world.boss) return false;
      this.#bossClear -= dt;
      return this.#bossClear <= 0;
    }
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
    this.#bossClear = WAVES.bossClearDelay;
    for (const ship of world.ships) ship.prepareForWave();
    world.speedScale = 1 + this.wave * RULES.speedGrowthPerWave;
    if (this.isBossWave()) return this.#spawnBoss(world);
    const count = Math.min(WAVES.opening + (this.wave - 1) * WAVES.openingPerWave + Math.floor(world.ships.length / 2), RULES.maxWaveSize);
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

  // Enemies enter at the edges heading roughly into the arena. Each one is a
  // drone, plane or zeppelin, picked by this wave's ENEMY_MIX weights.
  #spawn(world, count) {
    for (let i = 0; i < count; i++) {
      const p = this.#edgePoint(world);
      const size = this.#pickType(world);
      const heading = Math.atan2(world.height / 2 - p.y, world.width / 2 - p.x) + rand(-0.8, 0.8);
      world.asteroids.push(new Asteroid(size, p.x, p.y, world.speedScale, { heading }));
    }
  }

  // 1 drone, 2 plane, 3 zeppelin; the mix slides from ENEMY_MIX.first to .last over the timed waves
  #pickType(world) {
    const k = Math.min(1, Math.max(0, (this.wave - 1) / Math.max(1, WAVES.final - 2)));
    const weights = ENEMY_MIX.first.map((w, i) => w + (ENEMY_MIX.last[i] - w) * k);
    if (world.asteroids.filter(a => a.kind === 'zeppelin').length >= WAVES.maxZeppelins) weights[2] = 0;
    let r = rand(0, weights.reduce((a, b) => a + b));
    for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i + 1;
    return 1;
  }

  // the wave-5 style boss mid-game, the Mothership on the final wave
  #spawnBoss(world) {
    const pilots = Math.max(1, world.ships.length);
    const p = this.#bossPoint(world);
    const final = this.isFinalWave;
    if (final) {
      world.boss = new Mothership(p.x, p.y, MOTHERSHIP.baseHp + MOTHERSHIP.hpPerShip * (pilots - 1));
    } else {
      const level = this.wave / BOSS.every;
      const hp = Math.round((BOSS.baseHp + BOSS.hpPerShip * (pilots - 1)) * (1 + BOSS.hpGrowth * (level - 1)));
      world.boss = new Boss(p.x, p.y, hp, level);
    }
    this.bus.emit(EVENTS.WAVE_STARTED, { wave: this.wave, boss: true, final });
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
