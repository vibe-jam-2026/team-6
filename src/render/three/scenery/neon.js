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

// Glowing, unshadowed instanced blocks (lights shouldn't cast or catch shadows).
const lights = (strength, items) => {
  const mesh = instanced(createBlockGeometry(), glow(strength), items);
  mesh.castShadow = mesh.receiveShadow = false;
  return mesh;
};

// four thin bars tracing the edge of a w x d rectangle at height z
const outline = (x, y, z, w, d, t, color, list) => {
  list.push(
    { x, y: y - d / 2, z, sx: w + t, sy: t, sz: t, color },
    { x, y: y + d / 2, z, sx: w + t, sy: t, sz: t, color },
    { x: x - w / 2, y, z, sx: t, sy: d, sz: t, color },
    { x: x + w / 2, y, z, sx: t, sy: d, sz: t, color },
  );
};

// Neon city at night: a grid of dark towers traced in neon, with glowing
// rooftops, window bands, light strips and beacons, and avenues of light.
export const neon = {
  mood: { sky: 0x140a2e, hemiSky: 0x8a5cff, hemiGround: 0x2a0a30, hemi: 0.75, sun: 0xc070ff, sunIntensity: 0.6, bloom: { strength: 0.85, radius: 0.18, threshold: 0.65 } },

  build(w, h) {
    const districts = valueNoise(91), rng = seededRandom(9), pick = list => list[Math.floor(rng() * list.length)];
    const heightAt = (x, y) => BASE + 1 + outsideBy(x, y, w, h) * 0.02;
    const asphalt = new THREE.Color(0x15122a), plaza = new THREE.Color(0x261a3e);
    const colorAt = (x, y, z, c) => c.copy(fbm(districts, x / 200, y / 200, 2) > 0.62 ? plaza : asphalt);
    const terrain = createTerrain(w, h, heightAt, colorAt, 120);
    const groundAt = terrain.userData.groundAt;
    const area = visibleArea(w, h);
    const downtown = { x: w * 0.1, y: h * 0.9 };

    const towers = [], roofs = [], edges = [], bands = [], strips = [], beacons = [];
    for (let gx = Math.floor(area.x0 / LOT); gx * LOT < area.x1; gx++) {
      for (let gy = Math.floor(area.y0 / LOT); gy * LOT < area.y1; gy++) {
        if (gx % 4 === 0 || gy % 4 === 0 || rng() < 0.12) continue; // avenues and empty lots
        const x = gx * LOT, y = gy * LOT, z = groundAt(x, y);
        const near = Math.max(0, 1 - Math.hypot(x - downtown.x, y - downtown.y) / (w * 0.9));
        const cap = outsideBy(x, y, w, h) > 30 ? 260 : CEILING - z - 3;
        const height = Math.min(cap, 10 + rng() * 14 + near * near * 200 * rng());
        const sx = 18 + rng() * 6, sy = 18 + rng() * 6;
        const hue = pick(NEON), top = z + height;
        towers.push({ x, y, z, sx, sy, sz: height, color: pick(TOWERS) });

        // every rooftop is traced in neon; some are lit all over
        outline(x, y, top, sx, sy, 0.9, hue, edges);
        if (rng() < 0.3) roofs.push({ x, y, z: top, sx: sx * 0.7, sy: sy * 0.7, sz: 0.6, color: pick(NEON) });

        // glowing window bands wrapped round the taller towers
        if (height > 22 && rng() < 0.55) {
          const step = 6 + rng() * 6, bandHue = rng() < 0.6 ? hue : pick(NEON);
          for (let bz = z + step; bz < top - 2; bz += step) bands.push({ x, y, z: bz, sx: sx + 0.3, sy: sy + 0.3, sz: 0.7, color: bandHue });
        }
        // vertical light strips up the corners
        if (height > 20 && rng() < 0.55) {
          const color = pick(NEON);
          for (const [cx, cy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]].slice(0, rng() < 0.5 ? 2 : 4)) {
            strips.push({ x: x + cx * sx / 2, y: y + cy * sy / 2, z, sx: 1.2, sy: 1.2, sz: height, color });
          }
        }
        // antenna beacons on the skyscrapers
        if (height > 45) {
          beacons.push({ x, y, z: top, sx: 0.8, sy: 0.8, sz: 6 + rng() * 8, color: 0xffffff });
          beacons.push({ x, y, z: top + 12, sx: 2.4, sy: 2.4, sz: 2.4, color: rng() < 0.5 ? 0xff2fd0 : 0x2fe8ff });
        }
      }
    }

    // streets: bright light trails along every avenue with a wide, dim glow under them
    const lines = [], glowLanes = [];
    const lane = (item, wide) => { lines.push(item); glowLanes.push({ ...item, ...wide, z: BASE + 1.05, sz: 0.1 }); };
    for (let gx = Math.floor(area.x0 / LOT); gx * LOT < area.x1; gx++) {
      if (gx % 4 !== 0) continue;
      const color = rng() < 0.5 ? 0x2fe8ff : 0xff2fd0, x = gx * LOT, cy = (area.y0 + area.y1) / 2, len = area.y1 - area.y0;
      for (const off of [-5, 5]) lane({ x: x + off, y: cy, z: BASE + 1.2, sx: 1.2, sy: len, sz: 0.4, color }, { sx: 6 });
    }
    for (let gy = Math.floor(area.y0 / LOT); gy * LOT < area.y1; gy++) {
      if (gy % 4 !== 0) continue;
      const color = rng() < 0.5 ? 0xffe14d : 0xb44dff, y = gy * LOT, cx = (area.x0 + area.x1) / 2, len = area.x1 - area.x0;
      for (const off of [-5, 5]) lane({ x: cx, y: y + off, z: BASE + 1.2, sx: len, sy: 1.2, sz: 0.4, color }, { sy: 6 });
    }

    return [
      terrain,
      instanced(createBlockGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6, flatShading: true }), towers),
      lights(0.15, glowLanes),
      lights(1.1, lines),
      lights(0.8, roofs),
      lights(1.4, edges),
      lights(1.0, bands),
      lights(1.4, strips),
      lights(2, beacons),
    ];
  },
};
