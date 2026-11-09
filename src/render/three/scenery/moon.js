import * as THREE from 'three';
import { valueNoise, fbm, seededRandom } from './noise.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, instanced, createBlockGeometry } from './terrain.js';

// Lunar surface: grey regolith pocked with craters of every size, under a
// black sky, with a small moon base of domes and solar panels.
export const moon = {
  mood: { sky: 0x04050a, hemiSky: 0xa8b2cc, hemiGround: 0x0c0c10, hemi: 0.55, sun: 0xffffff, sunIntensity: 3.0 },

  build(w, h) {
    const dust = valueNoise(101), rng = seededRandom(10);
    const area = visibleArea(w, h);
    // craters: a bowl with a raised rim; a few big ones, many small ones
    const craters = [];
    for (let i = 0; i < 70; i++) {
      const big = i < 8;
      craters.push({
        x: area.x0 - 100 + rng() * (area.x1 - area.x0 + 200), y: area.y0 - 100 + rng() * (area.y1 - area.y0 + 200),
        r: big ? 90 + rng() * 110 : 14 + rng() * 40,
      });
    }
    const craterAt = (x, y) => {
      let dz = 0;
      for (const c of craters) {
        const d = Math.hypot(x - c.x, y - c.y) / c.r;
        if (d > 1.6) continue;
        const depth = c.r * 0.16;
        dz += d < 1 ? -depth * (1 - d * d) : 0;
        dz += depth * 0.45 * Math.exp(-((d - 1) / 0.22) ** 2);
      }
      return dz;
    };
    const heightAt = (x, y) => BASE + 8 + fbm(dust, x / 160, y / 160, 3) * 6 + craterAt(x, y) + outsideBy(x, y, w, h) * 0.1;
    const light = new THREE.Color(0x9a9a9c), dark = new THREE.Color(0x4e4e54);
    const colorAt = (x, y, z, c) => c.copy(dark).lerp(light, Math.min(1, Math.max(0, (z - BASE + 4) / 22)) * (0.75 + fbm(dust, x / 40, y / 40, 2) * 0.3));
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;

    // the moon base sits south-east, partly inside the arena (kept low there)
    const base = { x: w * 0.3, y: -h * 0.32 };
    const domes = [], panels = [], windows = [];
    for (let i = 0; i < 7; i++) {
      const x = base.x + (rng() - 0.5) * 220, y = base.y + (rng() - 0.5) * 140, z = groundAt(x, y);
      const r = Math.min(10 + rng() * 10, (CEILING - z - 2));
      domes.push({ x, y, z, s: r, color: 0xe8ecf0 });
      windows.push({ x, y, z: z + r * 0.25, sx: r * 2.05, sy: r * 2.05, sz: r * 0.12, color: 0x7ad8ff });
    }
    for (let i = 0; i < 14; i++) {
      const x = base.x - 160 + (i % 7) * 26, y = base.y + 90 + Math.floor(i / 7) * 22, z = groundAt(x, y);
      panels.push({ x, y, z: z + 2, sx: 20, sy: 12, sz: 0.8, rot: 0.2, color: 0x1f3a7a });
    }

    const glowRing = new THREE.MeshBasicMaterial();
    glowRing.color.setScalar(2);
    return [
      terrain,
      instanced(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 }), domes),
      instanced(new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1, true).rotateX(Math.PI / 2), glowRing, windows),
      instanced(createBlockGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.6, flatShading: true }), panels),
    ];
  },
};
