// A computer pilot. It has the same shape as the human controllers
// (read(ship) -> { thrust, turn, fire } plus the menu presses), so a Ship
// cannot tell the difference. Each frame it:
//   1. dodges anything about to hit it (rocks, the boss, boss bullets),
//   2. otherwise turns to lead the best target and fires when lined up,
//   3. closes in with short bursts of thrust when the target is out of range.
// Between waves it browses the upgrades for a moment and takes one.

const TURN_GAIN = 5;          // turn input per radian off the wanted heading
const LOOKAHEAD = 0.9;        // s: how far ahead to look for collisions
const SAFETY_MARGIN = 26;     // px of clearance it wants around threats
const CRUISE_SPEED = 230;     // it only thrusts towards targets below this speed
const SHIP_PENALTY = 120;     // px: prefers rocks a little over enemy jets
const MENU_BROWSE_FRAMES = 25;
const MENU_PICK_FRAMES = 55;

const clamp = v => Math.max(-1, Math.min(1, v));
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
// shortest offset across a wrapping axis
const wrapDelta = (d, size) => d - size * Math.round(d / size);

export class ComputerShipController {
  isComputer = true;
  solo = false;       // set by the Session like the other controllers; unused
  useMouse = false;
  #menuFrames = 0;

  // getMode() returns the current game mode (for friendly fire)
  constructor(world, getMode) {
    this.world = world;
    this.getMode = getMode;
  }

  read(ship) {
    if (!ship) return { thrust: false, turn: 0, fire: false };
    const threat = ship.invulnerable > 0.4 ? null : this.#mostUrgentThreat(ship);
    if (threat) return this.#evade(ship, threat);
    return this.#attack(ship);
  }

  // --- combat ---

  #attack(ship) {
    const target = this.#pickTarget(ship);
    if (!target) return { thrust: false, turn: 0, fire: false };
    const aim = this.#lead(ship, target);
    const diff = wrapAngle(Math.atan2(aim.y, aim.x) - ship.angle);
    const dist = Math.hypot(aim.x, aim.y);
    const range = ship.stats.bulletSpeed * ship.stats.bulletLife;
    const tolerance = Math.max(0.05, Math.atan2(target.radius * 0.8, dist));
    const speed = Math.hypot(ship.vx, ship.vy);
    return {
      thrust: dist > range * 0.65 && Math.abs(diff) < 0.35 && speed < CRUISE_SPEED,
      turn: clamp(diff * TURN_GAIN),
      fire: Math.abs(diff) < tolerance && dist < range * 0.95,
    };
  }

  #pickTarget(ship) {
    const { world } = this;
    const candidates = [...world.asteroids];
    if (world.boss?.vulnerable) candidates.push(world.boss);
    if (this.getMode().friendlyFire) candidates.push(...world.ships.filter(s => s !== ship && s.alive));
    let best = null, bestScore = Infinity;
    for (const c of candidates) {
      const { x, y } = this.#offset(ship, c);
      const score = Math.hypot(x, y) + (c.controller ? SHIP_PENALTY : 0);
      if (score < bestScore) { best = c; bestScore = score; }
    }
    return best;
  }

  // Where to point so a bullet meets the target, which keeps moving.
  // Bullets inherit the ship's velocity, so work in the ship's frame.
  #lead(ship, target) {
    const p = this.#offset(ship, target);
    const vx = (target.vx ?? 0) - ship.vx, vy = (target.vy ?? 0) - ship.vy;
    let t = Math.hypot(p.x, p.y) / ship.stats.bulletSpeed;
    for (let i = 0; i < 3; i++) t = Math.hypot(p.x + vx * t, p.y + vy * t) / ship.stats.bulletSpeed;
    return { x: p.x + vx * t, y: p.y + vy * t };
  }

  // --- survival ---

  #mostUrgentThreat(ship) {
    const { world } = this;
    const threats = [
      ...world.asteroids,
      ...world.bullets.filter(b => b.hostile),
      ...(world.boss?.vulnerable ? [world.boss] : []),
    ];
    let worst = null;
    for (const o of threats) {
      const p = this.#offset(ship, o);
      const vx = (o.vx ?? 0) - ship.vx, vy = (o.vy ?? 0) - ship.vy;
      const v2 = vx * vx + vy * vy;
      // time and distance of closest approach if nobody changes course
      const tca = v2 > 1e-6 ? Math.max(0, Math.min(LOOKAHEAD, -(p.x * vx + p.y * vy) / v2)) : 0;
      const cx = p.x + vx * tca, cy = p.y + vy * tca;
      const clearance = Math.hypot(cx, cy) - o.radius - ship.radius - SAFETY_MARGIN;
      if (clearance < 0 && (!worst || tca < worst.tca)) worst = { cx, cy, vx, vy, tca };
    }
    return worst;
  }

  // Turn away from where the threat will be and burn; keep shooting if
  // something happens to be in front.
  #evade(ship, { cx, cy, vx, vy }) {
    let ax = -cx, ay = -cy;
    if (Math.hypot(ax, ay) < 1) { ax = -vy; ay = vx; } // dead centre: go sideways
    const diff = wrapAngle(Math.atan2(ay, ax) - ship.angle);
    const attack = this.#attack(ship);
    return { thrust: Math.abs(diff) < 1.3, turn: clamp(diff * TURN_GAIN), fire: attack.fire };
  }

  // offset from the ship to something, the short way round the wrapping arena
  #offset(ship, o) {
    const { width, height } = this.world;
    return { x: wrapDelta(o.x - ship.x, width), y: wrapDelta(o.y - ship.y, height) };
  }

  // --- menus ---

  // between waves: look at the offers for a moment, maybe move once, then take one
  stepPressed() {
    this.#menuFrames++;
    return this.#menuFrames === MENU_BROWSE_FRAMES ? Math.floor(Math.random() * 3) - 1 : 0;
  }

  confirmPressed() {
    if (this.#menuFrames < MENU_PICK_FRAMES) return false;
    this.#menuFrames = 0;
    return true;
  }

  selfDestructPressed() { return false; }
  togglePressed() { return false; }
}
