import * as THREE from 'three';
import { valueNoise, fbm, ridged, seededRandom, smoothstep } from './noise.js';
import { BASE, outsideBy, visibleArea, createTerrain, createWater, instanced } from './terrain.js';

const LAVA = BASE + 2;

// Volcanic isles: black basalt islands split by glowing lava channels, with
// a great volcano smouldering on the northern horizon under an ash-red sky.
export const volcano = {
  mood: { sky: 0x3a1812, hemiSky: 0xffa070, hemiGround: 0x1c0806, hemi: 0.85, sun: 0xffa868, sunIntensity: 1.8 },

  build(w, h) {
    const isles = valueNoise(71), crags = valueNoise(72), rng = seededRandom(7);
    const cone = { x: w * 0.12, y: h * 1.05, r: w * 0.5 };
    const coneAt = (x, y) => Math.max(0, 1 - Math.hypot(x - cone.x, y - cone.y) / cone.r);
    const isleAt = (x, y) => fbm(isles, x / 240, y / 240, 4);
    const heightAt = (x, y) => {
      const land = smoothstep(0.4, 0.52, isleAt(x, y));
      const rock = ridged(crags, x / 120, y / 120, 3);
      const k = coneAt(x, y), crater = smoothstep(0.86, 0.95, k) * 70;
      return LAVA - 5 + land * (8 + rock * 7) + k ** 1.7 * 230 - crater + outsideBy(x, y, w, h) * 0.05;
    };
    const basalt = new THREE.Color(0x26221f), ash = new THREE.Color(0x4a4440), crust = new THREE.Color(0x5a1a0c), ember = new THREE.Color(0x8a2a10);
    const colorAt = (x, y, z, c) => {
      if (z < LAVA + 1.2) return c.copy(crust);
      const k = coneAt(x, y);
      if (k > 0.82) return c.copy(ash).lerp(ember, smoothstep(0.82, 0.92, k));
      return c.copy(basalt).lerp(ash, fbm(crags, x / 60, y / 60, 2) * 0.8);
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;

    // the lava sea: dark red that glows through the bloom
    const lava = createWater(w, h, LAVA, 0x6a1404);
    lava.material.emissive = new THREE.Color(0xff4a10);
    lava.material.emissiveIntensity = 0.75;

    // molten pool in the crater
    const craterZ = groundAt(cone.x, cone.y) + 6;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(cone.r * 0.11, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a20).multiplyScalar(2.2) }));
    pool.position.set(cone.x, cone.y, craterZ);

    // boulders scattered over the islands
    const area = visibleArea(w, h), boulders = [];
    for (let i = 0; i < 5000 && boulders.length < 420; i++) {
      const x = area.x0 + rng() * (area.x1 - area.x0), y = area.y0 + rng() * (area.y1 - area.y0), z = groundAt(x, y);
      if (z < LAVA + 3 || coneAt(x, y) > 0.3) continue;
      boulders.push({ x, y, z, s: 3 + rng() * 6, rot: rng() * 6.3, color: rng() < 0.8 ? 0x2c2724 : 0x5a2a1a });
    }

    return [
      terrain,
      lava,
      pool,
      instanced(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), boulders),
    ];
  },
};
