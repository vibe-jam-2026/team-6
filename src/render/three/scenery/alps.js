import * as THREE from 'three';
import { valueNoise, fbm, ridged, seededRandom } from './noise.js';
import { BASE, outsideBy, visibleArea, createTerrain, createWater, instanced, createPineGeometry } from './terrain.js';

const LAKE = BASE + 7;
const PINE_GREENS = [0x1f3a26, 0x26452c, 0x1a3322];

// The Alps: sharp snowy ridges towering beyond the arena, green valleys,
// a turquoise glacier lake and dark pines on the lower slopes.
export const alps = {
  mood: { sky: 0x6a8cb4, hemiSky: 0xe2ecff, hemiGround: 0x3c4450, hemi: 1.0, sun: 0xffffff, sunIntensity: 2.2 },

  build(w, h) {
    const peaks = valueNoise(31), snow = valueNoise(32), rng = seededRandom(3);
    const heightAt = (x, y) => {
      const r = ridged(peaks, x / 430, y / 430), d = outsideBy(x, y, w, h);
      return BASE + 3 + r * r * 40 + r * d * (y < -h / 2 ? 0.5 : 2.4);
    };
    const meadow = new THREE.Color(0x4d6b38), rock = new THREE.Color(0x6a6660), darkRock = new THREE.Color(0x4f4b48), white = new THREE.Color(0xc4ccd6);
    const colorAt = (x, y, z, c) => {
      const snowline = BASE + 30 + fbm(snow, x / 80, y / 80, 2) * 14 + outsideBy(x, y, w, h) * 0.3;
      if (z > snowline) return c.copy(white);
      if (z < BASE + 16) return c.copy(meadow).lerp(rock, Math.max(0, (z - BASE - 8) / 8));
      return c.copy(darkRock).lerp(rock, fbm(snow, x / 50, y / 50, 2));
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;

    const area = visibleArea(w, h), trees = [];
    for (let i = 0; i < 8000 && trees.length < 1300; i++) {
      const x = area.x0 + rng() * (area.x1 - area.x0), y = area.y0 + rng() * (area.y1 - area.y0), z = groundAt(x, y);
      if (z < LAKE + 1 || z > BASE + 20 || rng() < 0.3) continue;
      trees.push({ x, y, z, s: 11 + rng() * 7, rot: rng() * 6.3, color: PINE_GREENS[Math.floor(rng() * PINE_GREENS.length)] });
    }

    return [
      terrain,
      createWater(w, h, LAKE, 0x2a7f86),
      instanced(createPineGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees),
    ];
  },
};
