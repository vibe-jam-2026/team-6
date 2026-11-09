import * as THREE from 'three';
import { valueNoise, fbm, seededRandom, smoothstep } from './noise.js';
import { BASE, outsideBy, visibleArea, createTerrain, createWater, instanced, createPineGeometry, createBlockGeometry, createRoofGeometry } from './terrain.js';

const WATER = BASE + 1;
const FALU_RED = [0x8b2a1e, 0x9a3122, 0x7c241a];
const PINE_GREENS = [0x1f3a22, 0x24452a, 0x2b4f2c, 0x1b331f];

// Swedish forest: rolling hills of spruce and pine, dark lakes and red cottages.
export const forest = {
  mood: { sky: 0x5b7388, hemiSky: 0xcfe0f0, hemiGround: 0x2a3a24, hemi: 0.95, sun: 0xfff0d6, sunIntensity: 2.0 },

  build(w, h) {
    const hills = valueNoise(11), lakes = valueNoise(12), woods = valueNoise(13), rng = seededRandom(1);
    const lakeAt = (x, y) => fbm(lakes, x / 430, y / 430, 3);
    const woodsAt = (x, y) => fbm(woods, x / 260, y / 260, 3);
    const heightAt = (x, y) => {
      const d = outsideBy(x, y, w, h);
      const far = d * 0.18 * fbm(hills, x / 900 + 5, y / 900) * (y < -h / 2 ? 0.3 : 1);
      return BASE + 5 + 11 * fbm(hills, x / 380, y / 380) + far - smoothstep(0.45, 0.37, lakeAt(x, y)) * 18;
    };
    const shore = new THREE.Color(0x77705a), meadow = new THREE.Color(0x5e7a3c), mossA = new THREE.Color(0x223d1f), mossB = new THREE.Color(0x3d6030);
    const colorAt = (x, y, z, c) => {
      if (z < WATER + 1.5) return c.copy(shore);
      if (woodsAt(x, y) < 0.36) return c.copy(meadow).lerp(mossB, fbm(hills, x / 90, y / 90, 2) * 0.6);
      return c.copy(mossA).lerp(mossB, fbm(hills, x / 120, y / 120, 2));
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;

    const area = visibleArea(w, h), pick = list => list[Math.floor(rng() * list.length)];
    const randomPoint = () => [area.x0 + rng() * (area.x1 - area.x0), area.y0 + rng() * (area.y1 - area.y0)];

    const trees = [];
    for (let i = 0; i < 9000 && trees.length < 2200; i++) {
      const [x, y] = randomPoint(), z = groundAt(x, y);
      if (z < WATER + 2 || woodsAt(x, y) < 0.42 + rng() * 0.08) continue;
      trees.push({ x, y, z, s: 13 + rng() * 9, rot: rng() * 6.3, color: pick(PINE_GREENS) });
    }

    const walls = [], roofs = [];
    for (let i = 0; i < 3000 && walls.length < 26; i++) {
      const [x, y] = randomPoint(), z = groundAt(x, y), lake = lakeAt(x, y);
      if (z < WATER + 2 || lake < 0.45 || lake > 0.5 || woodsAt(x, y) > 0.5) continue;
      const rot = rng() * Math.PI;
      walls.push({ x, y, z, sx: 14, sy: 9, sz: 7, rot, color: pick(FALU_RED) });
      roofs.push({ x, y, z: z + 7, sx: 16, sy: 10.5, sz: 7, rot, color: 0x2a2a2e });
    }

    const wallMaterial = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
    return [
      terrain,
      createWater(w, h, WATER, 0x1c3444),
      instanced(createPineGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees),
      instanced(createBlockGeometry(), wallMaterial, walls),
      instanced(createRoofGeometry(), wallMaterial.clone(), roofs),
    ];
  },
};
