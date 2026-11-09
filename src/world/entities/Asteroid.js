import { ENEMY_TYPES } from '../../config.js';
import { rand, TAU } from '../../core/math.js';
import { Bullet } from './Bullet.js';

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
// shortest offset across a wrapping axis
const wrapDelta = (d, size) => d - size * Math.round(d / size);

// An enemy. (The class keeps its old name: the game started as an asteroid
// shooter, and world.asteroids still holds every enemy.) The size picks the
// type from ENEMY_TYPES:
//   1 drone    - flies straight ahead
//   2 plane    - turns towards the nearest jet and fires at it
//   3 zeppelin - drifts slowly and launches drones
// update() only moves it; think() is where planes and zeppelins act, and it
// returns what they produced so a system can put it into the world.
export class Asteroid {
  #reload = 0;
  #launches = [];  // drones this zeppelin launched (to cap how many are up)

  // heading: direction of travel (random if not given)
  constructor(size, x, y, speedScale = 1, { heading = rand(0, TAU) } = {}) {
    const type = ENEMY_TYPES[size];
    this.type = type;
    this.size = size;
    this.kind = type.kind;
    this.radius = type.radius;
    this.score = type.score;
    this.bounty = type.bounty;
    this.color = type.color;
    this.hp = type.hp;
    this.speed = rand(type.speed[0], type.speed[1]) * speedScale;
    this.x = x; this.y = y;
    this.vx = Math.cos(heading) * this.speed;
    this.vy = Math.sin(heading) * this.speed;
    this.#reload = type.fireEvery ? rand(...type.fireEvery) : type.launchEvery ? rand(...type.launchEvery) * 0.5 : 0;
    // orientation: yaw (in the play plane) plus two tumble axes for the 3D view
    this.angle = heading; this.spin = rand(-1.2, 1.2);
    this.tumbleX = rand(0, TAU); this.tumbleXSpeed = rand(-1.2, 1.2);
    this.tumbleY = rand(0, TAU); this.tumbleYSpeed = rand(-1.2, 1.2);
  }

  get alive() { return this.hp > 0; }
  get heading() { return Math.atan2(this.vy, this.vx); }

  // one hit; true if that destroyed it
  takeHit() {
    this.hp -= 1;
    return this.hp <= 0;
  }

  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spin * dt;
    this.tumbleX += this.tumbleXSpeed * dt;
    this.tumbleY += this.tumbleYSpeed * dt;
    bounds.wrap(this);
  }

  // Steering and attacks. Returns { shots: Bullet[], launches: Asteroid[] }.
  think(dt, world) {
    if (this.kind === 'plane') return this.#fly(dt, world);
    if (this.kind === 'zeppelin') return this.#launch(dt, world);
    return NOTHING;
  }

  // planes: bank towards the nearest jet and fire when it is in front
  #fly(dt, world) {
    const target = this.#nearestShip(world);
    if (!target) return NOTHING;
    const { x, y } = this.#offset(world, target);
    const off = wrapAngle(Math.atan2(y, x) - this.heading);
    const turn = Math.max(-1, Math.min(1, off * 3)) * this.type.turnRate * dt;
    const h = this.heading + turn;
    this.vx = Math.cos(h) * this.speed;
    this.vy = Math.sin(h) * this.speed;

    this.#reload -= dt;
    const inRange = Math.hypot(x, y) < this.type.fireRange && Math.abs(off) < this.type.fireCone;
    if (this.#reload > 0 || !inRange) return NOTHING;
    this.#reload = rand(...this.type.fireEvery);
    const b = this.type.bullet, r = this.radius;
    const nx = Math.cos(h), ny = Math.sin(h);
    return {
      shots: [new Bullet(this, this.x + nx * r, this.y + ny * r, nx * b.speed + this.vx * 0.3, ny * b.speed + this.vy * 0.3,
        { life: b.life, radius: b.radius, hostile: true })],
      launches: [],
    };
  }

  // zeppelins: every so often a drone leaves, aimed roughly at the nearest jet
  #launch(dt, world) {
    this.#launches = this.#launches.filter(d => d.alive && world.asteroids.includes(d));
    this.#reload -= dt;
    if (this.#reload > 0 || this.#launches.length >= this.type.maxDrones) return NOTHING;
    this.#reload = rand(...this.type.launchEvery);
    const target = this.#nearestShip(world);
    const aim = target ? Math.atan2(this.#offset(world, target).y, this.#offset(world, target).x) : rand(0, TAU);
    const heading = aim + rand(-this.type.launchSpread, this.type.launchSpread);
    const drone = new Asteroid(1, this.x + Math.cos(heading) * this.radius, this.y + Math.sin(heading) * this.radius,
      world.speedScale, { heading });
    this.#launches.push(drone);
    return { shots: [], launches: [drone] };
  }

  #nearestShip(world) {
    let best = null, bestD = Infinity;
    for (const s of world.ships) {
      if (!s.alive) continue;
      const { x, y } = this.#offset(world, s);
      const d = x * x + y * y;
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  // offset to something, the short way round the wrapping arena
  #offset(world, o) {
    return { x: wrapDelta(o.x - this.x, world.width), y: wrapDelta(o.y - this.y, world.height) };
  }
}

const NOTHING = Object.freeze({ shots: [], launches: [] });
