import * as THREE from 'three';
import { valueNoise, fbm, seededRandom, smoothstep } from './noise.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, createWater, instanced, createBlockGeometry } from './terrain.js';

const SEA = BASE + 1;

// Arctic: cracked sheets of pack ice drifting on a dark polar sea, tall
// icebergs, a red research station, and a glacier wall to the north.
export const arctic = {
  mood: { sky: 0x9ab8cf, hemiSky: 0xf0f8ff, hemiGround: 0x2c4a66, hemi: 1.15, sun: 0xfff6ee, sunIntensity: 2.3 },

  build(w, h) {
    const floes = valueNoise(81), cracks = valueNoise(82), rng = seededRandom(8);
    const floeAt = (x, y) => fbm(floes, x / 210, y / 210, 4) - Math.abs(cracks(x / 45, y / 45) - 0.5) * 0.18;
    const heightAt = (x, y) => {
      const ice = smoothstep(0.45, 0.48, floeAt(x, y));
      const glacier = Math.max(0, y - h * 0.62) * 0.9 + outsideBy(x, y, w, h) * 0.08;
      return SEA - 6 + ice * (7.5 + fbm(cracks, x / 30, y / 30, 2) * 1.5) + glacier;
    };
    const deep = new THREE.Color(0x0c2236), snow = new THREE.Color(0xeef4fa), blueIce = new THREE.Color(0xa8cce4);
    const colorAt = (x, y, z, c) => {
      if (z < SEA) return c.copy(deep);
      return c.copy(blueIce).lerp(snow, smoothstep(SEA + 1, SEA + 3, z) * (0.6 + fbm(cracks, x / 70, y / 70, 2) * 0.4));
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;
    const area = visibleArea(w, h);
    const randomPoint = () => [area.x0 + rng() * (area.x1 - area.x0), area.y0 + rng() * (area.y1 - area.y0)];

    // icebergs in open water; inside the arena they stay below the action
    const bergs = [];
    for (let i = 0; i < 4000 && bergs.length < 70; i++) {
      const [x, y] = randomPoint();
      if (groundAt(x, y) > SEA - 2) continue;
      // the shape reaches 1.6x its scale above its base
      const cap = outsideBy(x, y, w, h) > 40 ? 60 : (CEILING - (SEA - 4) - 2) / 1.6;
      const s = 10 + rng() * 22;
      bergs.push({ x, y, z: SEA - 4, sx: s, sy: s * (0.7 + rng() * 0.5), sz: Math.min(cap, s * (0.8 + rng())), rot: rng() * 6.3,
        color: rng() < 0.6 ? 0xe8f4ff : 0xbcdcf0 });
    }

    // a research station on one of the larger floes: huts and radio masts
    const huts = [], masts = [];
    for (let i = 0; i < 3000 && huts.length < 9; i++) {
      const [x, y] = randomPoint();
      if (floeAt(x, y) < 0.56 || huts.some(o => Math.hypot(o.x - x, o.y - y) > 160)) continue;
      const z = groundAt(x, y), rot = rng() * 1.5;
      huts.push({ x, y, z, sx: 14, sy: 9, sz: 6, rot, color: rng() < 0.7 ? 0xc0392b : 0xe0a030 });
      if (rng() < 0.5) masts.push({ x: x + 12, y: y + 6, z, sx: 1.2, sy: 1.2, sz: Math.min(CEILING - z - 2, 30), color: 0xdddddd });
    }

    const mat = () => new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true });
    return [
      terrain,
      createWater(w, h, SEA, 0x123650),
      instanced(new THREE.IcosahedronGeometry(1, 0).translate(0, 0, 0.6), mat(), bergs),
      instanced(createBlockGeometry(), mat(), huts),
      instanced(createBlockGeometry(), mat(), masts),
    ];
  },
};
