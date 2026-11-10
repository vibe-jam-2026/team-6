// A computer pilot. It has the same shape as the human controllers
// (read(ship) -> { thrust, turn, fire } plus the menu presses), so a Ship
// cannot tell the difference. Each frame it:
//   1. dodges anything about to hit it (rocks, the boss, boss bullets),
//   2. otherwise turns to lead the best target and fires when lined up,
//   3. closes in with short bursts of thrust when the target is out of range,
//   4. picks a weapon for the range: scatter up close, blaster, then rockets.
// Between waves it spends its money in the shop (see pickPurchase).

// skill-dependent numbers (reaction, aim, dodging) come from CPU_SKILLS via getSkill()
const ACE = { think: 1, aimError: 0, lookahead: 0.9, margin: 26, turnGain: 5, roll: 3 };
const AIM_DRIFT_FRAMES = 50;  // how often its aim error wanders to a new value
const CRUISE_SPEED = 230;     // it only thrusts towards targets below this speed
const SHIP_PENALTY = 120;     // px: prefers rocks a little over enemy jets
// how much the computer likes each upgrade when shopping (default 1)
const SHOP_TASTE = { rapidFire: 2, spread: 2, railRounds: 1.5, deflector: 1.5, spareShip: 0.8 };
const WEAPON_SWITCH_FRAMES = 90; // waits this long between weapon changes so it doesn't flap

const clamp = v => Math.max(-1, Math.min(1, v));
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
// shortest offset across a wrapping axis
const wrapDelta = (d, size) => d - size * Math.round(d / size);

export class ComputerShipController {
  isComputer = true;
  solo = false;       // set by the Session like the other controllers; unused
  useMouse = false;
  #wantedWeapon = null;
  #weaponFrames = 0;
  #ship = null;
  #frame = 0;
  #held = null;       // the last decision, repeated until it thinks again
  #aimOffset = 0;

  // getMode() returns the current game mode (for friendly fire),
  // getSkill() one of CPU_SKILLS (how well it flies)
  constructor(world, getMode, getSkill = () => ACE) {
    this.world = world;
    this.getMode = getMode;
    this.getSkill = getSkill;
  }

  get skill() { return this.getSkill() ?? ACE; }

  read(ship) {
    if (!ship) return { thrust: false, turn: 0, fire: false };
    this.#ship = ship;
    const skill = this.skill;
    this.#frame++;
    if (this.#frame % AIM_DRIFT_FRAMES === 0) this.#aimOffset = (Math.random() * 2 - 1) * skill.aimError;
    // a slower pilot only thinks every few frames and holds its input in between
    if (this.#held && this.#frame % skill.think !== 0) return { ...this.#held, roll: 0 };
    const threat = ship.invulnerable > 0.4 ? null : this.#mostUrgentThreat(ship);
    this.#held = threat ? this.#evade(ship, threat) : this.#attack(ship);
    return this.#held;
  }

  // --- combat ---

  #attack(ship) {
    const target = this.#pickTarget(ship);
    if (!target) return { thrust: false, turn: 0, fire: false };
    const aim = this.#lead(ship, target);
    const diff = wrapAngle(Math.atan2(aim.y, aim.x) + this.#aimOffset - ship.angle);
    const dist = Math.hypot(aim.x, aim.y);
    this.#chooseWeapon(ship, dist);
    const range = this.#range(ship, ship.weapon);
    const tolerance = Math.max(0.05, Math.atan2(target.radius * 0.8, dist));
    const speed = Math.hypot(ship.vx, ship.vy);
    return {
      thrust: dist > range * 0.65 && Math.abs(diff) < 0.35 && speed < CRUISE_SPEED,
      turn: clamp(diff * this.skill.turnGain),
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
    const speed = this.#bulletSpeed(ship, ship.weapon);
    let t = Math.hypot(p.x, p.y) / speed;
    for (let i = 0; i < 3; i++) t = Math.hypot(p.x + vx * t, p.y + vy * t) / speed;
    return { x: p.x + vx * t, y: p.y + vy * t };
  }

  // --- weapons ---

  #bulletSpeed(ship, w) { return ship.stats.bulletSpeed * (w?.speed ?? 1); }
  #range(ship, w) { return this.#bulletSpeed(ship, w) * ship.stats.bulletLife * (w?.life ?? 1); }

  // the shortest-range weapon that still reaches the target hits hardest
  #chooseWeapon(ship, dist) {
    const weapons = ship.weapons ?? [];
    const reach = w => this.#range(ship, w) * 0.8;
    const inReach = weapons.filter(w => reach(w) >= dist).sort((a, b) => reach(a) - reach(b));
    const longest = [...weapons].sort((a, b) => reach(b) - reach(a))[0];
    this.#wantedWeapon = (inReach[0] ?? longest)?.id ?? null;
  }

  // 1 to cycle to the next weapon while it is not yet holding the one it wants
  weaponStep() {
    const ship = this.#ship;
    this.#weaponFrames++;
    if (!ship?.weapon || !this.#wantedWeapon || ship.weapon.id === this.#wantedWeapon) return 0;
    if (this.#weaponFrames < WEAPON_SWITCH_FRAMES) return 0;
    // keep cycling every frame until the wanted gun comes up, then rest
    if (ship.weapons[(ship.weaponIndex + 1) % ship.weapons.length].id === this.#wantedWeapon) this.#weaponFrames = 0;
    return 1;
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
      const tca = v2 > 1e-6 ? Math.max(0, Math.min(this.skill.lookahead, -(p.x * vx + p.y * vy) / v2)) : 0;
      const cx = p.x + vx * tca, cy = p.y + vy * tca;
      const clearance = Math.hypot(cx, cy) - o.radius - ship.radius - this.skill.margin;
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
    return { thrust: Math.abs(diff) < 1.3, turn: clamp(diff * this.skill.turnGain), fire: attack.fire };
  }

  // offset from the ship to something, the short way round the wrapping arena
  #offset(ship, o) {
    const { width, height } = this.world;
    return { x: wrapDelta(o.x - ship.x, width), y: wrapDelta(o.y - ship.y, height) };
  }

  // --- shop ---

  // Between waves the shop asks, one purchase at a time, what to buy from what
  // it can afford; null means done. It favours guns, then whatever is cheap.
  pickPurchase(affordable) {
    if (!affordable.length) return null;
    const scored = affordable.map(u => ({ u, w: (SHOP_TASTE[u.id] ?? 1) * (0.5 + Math.random()) }));
    return scored.reduce((best, c) => c.w > best.w ? c : best).u;
  }

  // the shop drives a computer pilot through pickPurchase, never through key presses
  stepPressed() { return 0; }
  confirmPressed() { return false; }

  selfDestructPressed() { return false; }
  togglePressed() { return false; }
}
