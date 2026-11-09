import { dist2, rand } from '../core/math.js';

const HOME_SLOTS = [[0.25, 0.3], [0.75, 0.7], [0.75, 0.3], [0.25, 0.7]];
const SAFE_CLEARANCE = 120;

// Chooses where a ship (re)appears: its home slot if that is clear,
// otherwise the candidate furthest from rocks and other ships.
export class SpawnPlanner {
  findSpot(ship, world) {
    const { width: w, height: h } = world;
    const home = HOME_SLOTS[ship.index % HOME_SLOTS.length];
    const preferred = { x: home[0] * w, y: home[1] * h };
    if (this.#clearance(preferred, ship, world) > SAFE_CLEARANCE) return preferred;

    const candidates = [preferred, { x: w / 2, y: h / 2 }];
    for (let i = 0; i < 20; i++) candidates.push({ x: rand(80, w - 80), y: rand(80, h - 80) });
    let best = preferred, bestClearance = -Infinity;
    for (const c of candidates) {
      const d = this.#clearance(c, ship, world);
      if (d > bestClearance) { bestClearance = d; best = c; }
    }
    return best;
  }

  #clearance(p, ship, world) {
    let min = Infinity;
    for (const a of world.asteroids) min = Math.min(min, Math.sqrt(dist2(a, p)) - a.radius);
    for (const s of world.ships) if (s !== ship && s.alive) min = Math.min(min, Math.sqrt(dist2(s, p)) - 40);
    return min;
  }
}
