import * as THREE from 'three';
import { valueNoise, fbm, seededRandom } from './noise.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, instanced, createBlockGeometry } from './terrain.js';

const LOT = 30;
const NEON = [0xff2fd0, 0x2fe8ff, 0xb44dff, 0xffe14d, 0x4dff9a, 0xff5a3a];
const TOWERS = [0x161827, 0x1c1f30, 0x22253a, 0x131522];

// Glowing parts use MeshBasicMaterial (unlit) with colours pushed past 1 so
// the bloom pass makes them shine against the night.
const glow = strength => {
  const m = new THREE.MeshBasicMaterial();
  m.color.setScalar(strength);
  return m;
};

// Neon city at night: a grid of dark towers with glowing rooftops and
// light strips, and streets traced in lines of light.
export const neon = {
  mood: { sky: 0x0c0820, hemiSky: 0x6a58c0, hemiGround: 0x08080f, hemi: 0.6, sun: 0x9a88ff, sunIntensity: 0.55 },

  build(w, h) {
    const districts = valueNoise(91), rng = seededRandom(9), pick = list => list[Math.floor(rng() * list.length)];
    const heightAt = (x, y) => BASE + 1 + outsideBy(x, y, w, h) * 0.02;
    const asphalt = new THREE.Color(0x10111a), plaza = new THREE.Color(0x1c1e2c);
    const colorAt = (x, y, z, c) => c.copy(fbm(districts, x / 200, y / 200, 2) > 0.62 ? plaza : asphalt);
    const terrain = createTerrain(w, h, heightAt, colorAt, 120);
    const groundAt = terrain.userData.groundAt;
    const area = visibleArea(w, h);
    const downtown = { x: w * 0.1, y: h * 0.9 };

    const towers = [], roofs = [], strips = [];
    for (let gx = Math.floor(area.x0 / LOT); gx * LOT < area.x1; gx++) {
      for (let gy = Math.floor(area.y0 / LOT); gy * LOT < area.y1; gy++) {
        if (gx % 4 === 0 || gy % 4 === 0 || rng() < 0.12) continue; // avenues and empty lots
        const x = gx * LOT, y = gy * LOT, z = groundAt(x, y);
        const near = Math.max(0, 1 - Math.hypot(x - downtown.x, y - downtown.y) / (w * 0.9));
        const cap = outsideBy(x, y, w, h) > 30 ? 260 : CEILING - z - 3;
        const height = Math.min(cap, 10 + rng() * 14 + near * near * 200 * rng());
        const sx = 18 + rng() * 6, sy = 18 + rng() * 6;
        towers.push({ x, y, z, sx, sy, sz: height, color: pick(TOWERS) });
        if (rng() < 0.35) roofs.push({ x, y, z: z + height, sx: sx + 0.6, sy: sy + 0.6, sz: 1.2, color: pick(NEON) });
        if (height > 30 && rng() < 0.3) {
          strips.push({ x: x + sx / 2, y: y + sy / 2, z, sx: 1.4, sy: 1.4, sz: height, color: pick(NEON) });
        }
      }
    }

    // streets: light trails along every avenue
    const lines = [];
    for (let gx = Math.floor(area.x0 / LOT); gx * LOT < area.x1; gx++) {
      if (gx % 4 === 0) lines.push({ x: gx * LOT, y: (area.y0 + area.y1) / 2, z: BASE + 1.2, sx: 1.6, sy: area.y1 - area.y0, sz: 0.4, color: rng() < 0.5 ? 0x2fe8ff : 0xff2fd0 });
    }
    for (let gy = Math.floor(area.y0 / LOT); gy * LOT < area.y1; gy++) {
      if (gy % 4 === 0) lines.push({ x: (area.x0 + area.x1) / 2, y: gy * LOT, z: BASE + 1.2, sx: area.x1 - area.x0, sy: 1.6, sz: 0.4, color: rng() < 0.5 ? 0xffe14d : 0xb44dff });
    }

    return [
      terrain,
      instanced(createBlockGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.4, flatShading: true }), towers),
      instanced(createBlockGeometry(), glow(0.75), roofs),
      instanced(createBlockGeometry(), glow(1.3), strips),
      instanced(createBlockGeometry(), glow(0.55), lines),
    ];
  },
};
