import * as THREE from 'three';
import { valueNoise, fbm, seededRandom, smoothstep } from './noise.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, createWater, instanced, createBlockGeometry } from './terrain.js';

const WATER = BASE + 1;
const FACADES = [0xc9a25a, 0xb5523b, 0xd8cfb4, 0x9c4a2e, 0xc7b48a, 0x8c8f93, 0xd9b57a, 0xa8664a];
const LOT = 26;

// City coastline: an old harbour town of ochre and terracotta blocks along a
// rocky shore, with skerries and boats out in the bay.
export const coast = {
  mood: { sky: 0x5a6680, hemiSky: 0xc0c8e8, hemiGround: 0x2c2a33, hemi: 0.9, sun: 0xffc896, sunIntensity: 2.1 },

  build(w, h) {
    const shoreNoise = valueNoise(21), isles = valueNoise(22), parks = valueNoise(23), rng = seededRandom(2);
    // > 0 on land (north-east), < 0 in the bay (south-west)
    const landAt = (x, y) => 0.6 * x + 0.8 * y + w * 0.12 + (fbm(shoreNoise, x / 520, y / 520, 4) - 0.5) * 520;
    const isleAt = (x, y) => fbm(isles, x / 150, y / 150, 3);
    const parkAt = (x, y) => fbm(parks, x / 240, y / 240, 3);
    const heightAt = (x, y) => {
      const s = landAt(x, y);
      if (s > 0) {
        const far = outsideBy(x, y, w, h) * 0.25 * fbm(shoreNoise, x / 700, y / 700) * (y < -h / 2 ? 0.3 : 1);
        return WATER + 1 + Math.min(s * 0.05, 4) + 3 * fbm(shoreNoise, x / 160, y / 160, 2) + far;
      }
      const seabed = WATER - 3 - Math.min(-s * 0.05, 18);
      return Math.max(seabed, WATER - 6 + smoothstep(0.62, 0.78, isleAt(x, y)) * 16);
    };
    const granite = new THREE.Color(0x7a6e68), street = new THREE.Color(0x3c3e44), park = new THREE.Color(0x3f6a35), seabed = new THREE.Color(0x24394a);
    const colorAt = (x, y, z, c) => {
      if (z < WATER) return c.copy(seabed);
      const s = landAt(x, y);
      if (s < 40) return c.copy(granite).multiplyScalar(0.85 + fbm(isles, x / 40, y / 40, 2) * 0.3);
      return c.copy(parkAt(x, y) < 0.36 ? park : street);
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;
    const area = visibleArea(w, h), pick = list => list[Math.floor(rng() * list.length)];

    // city blocks on a street grid, taller towards the old town centre
    const centre = { x: w * 0.25, y: h * 0.15 };
    const buildings = [];
    for (let gx = Math.floor(area.x0 / LOT); gx * LOT < area.x1; gx++) {
      for (let gy = Math.floor(area.y0 / LOT); gy * LOT < area.y1; gy++) {
        if (gx % 5 === 0 || gy % 4 === 0) continue; // avenues
        const x = gx * LOT, y = gy * LOT;
        if (landAt(x, y) < 55 || parkAt(x, y) < 0.36 || rng() < 0.08) continue;
        const z = groundAt(x, y);
        const near = Math.max(0, 1 - Math.hypot(x - centre.x, y - centre.y) / (w * 0.7));
        const cap = outsideBy(x, y, w, h) > 30 ? 160 : CEILING - z - 2;
        const height = Math.min(cap, 8 + rng() * 10 + near * near * 26 + (cap > 60 ? rng() * near * 90 : 0));
        buildings.push({ x, y, z, sx: 15 + rng() * 7, sy: 15 + rng() * 7, sz: height, color: pick(FACADES) });
      }
    }

    // boats out in the bay
    const hulls = [], cabins = [];
    for (let i = 0; i < 2000 && hulls.length < 22; i++) {
      const x = area.x0 + rng() * (area.x1 - area.x0), y = area.y0 + rng() * (area.y1 - area.y0);
      if (landAt(x, y) > -60 || groundAt(x, y) > WATER - 1) continue;
      const rot = rng() * Math.PI * 2, big = rng() < 0.25 ? 1.8 : 1;
      hulls.push({ x, y, z: WATER - 1, sx: 16 * big, sy: 6 * big, sz: 3.5, rot, color: rng() < 0.7 ? 0xf2f0ea : 0x2f4a6a });
      cabins.push({ x: x - Math.cos(rot) * 2 * big, y: y - Math.sin(rot) * 2 * big, z: WATER + 2.5, sx: 6 * big, sy: 4 * big, sz: 3, rot, color: 0xe8e4da });
    }

    const material = () => new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true });
    return [
      terrain,
      createWater(w, h, WATER, 0x235a80),
      instanced(createBlockGeometry(), material(), buildings),
      instanced(createBlockGeometry(), material(), hulls),
      instanced(createBlockGeometry(), material(), cabins),
    ];
  },
};
