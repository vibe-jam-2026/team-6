import * as THREE from 'three';
import { mergeFlat } from '../geometry.js';
import { valueNoise, fbm, seededRandom, smoothstep } from './noise.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, instanced, createBlockGeometry } from './terrain.js';

const LAVA = BASE + 1;
const CANOPIES = [0x7a3fa8, 0x9a4cc0, 0x3fa8a0, 0x5a3a9a, 0xb04c9a];
const HIDES = [0x9a6a3a, 0x8a5a30, 0xa87a48];

// Fantasy realm in the style of the classic high-fantasy MMOs: red-rock
// warlands with spiked war camps and an ancient glowing portal to the west,
// an enchanted violet forest with mana crystals and a blue-roofed keep to the
// east, and a lava rift snaking between the two.
export const realm = {
  mood: { sky: 0x4a3f6a, hemiSky: 0xe0c8ff, hemiGround: 0x3a2020, hemi: 1.0, sun: 0xffd8a8, sunIntensity: 2.2 },

  build(w, h) {
    const hills = valueNoise(41), biome = valueNoise(42), riftNoise = valueNoise(43), rng = seededRandom(4);
    // < 0 in the warlands (west), > 0 in the enchanted forest (east)
    const sideAt = (x, y) => x / (w * 0.5) + (fbm(biome, x / 400, y / 400, 3) - 0.5) * 1.2;
    const riftY = x => h * 0.05 + Math.sin(x / 260) * h * 0.18 + (fbm(riftNoise, x / 300, 3, 3) - 0.5) * 140;
    const riftAt = (x, y) => Math.abs(y - riftY(x));
    const heightAt = (x, y) => {
      const d = outsideBy(x, y, w, h), side = sideAt(x, y);
      let far = d * 0.22 * (0.5 + fbm(hills, x / 700, y / 700)) * (y < -h / 2 ? 0.3 : 1);
      if (side < 0) far = Math.round(far / 14) * 14; // stepped mesas in the warlands
      return BASE + 5 + 9 * fbm(hills, x / 300, y / 300) + far - smoothstep(55, 22, riftAt(x, y)) * 14;
    };
    const earth = new THREE.Color(0x9a5432), clay = new THREE.Color(0x6e3420), basalt = new THREE.Color(0x2a1c1c);
    const grass = new THREE.Color(0x2f5e4a), moss = new THREE.Color(0x4a3f7a);
    const colorAt = (x, y, z, c) => {
      const r = riftAt(x, y);
      if (r < 50) return c.copy(basalt).lerp(clay, smoothstep(30, 50, r) * 0.5);
      const t = smoothstep(-0.12, 0.12, sideAt(x, y));
      const west = c.copy(earth).lerp(clay, smoothstep(0.3, 0.7, fbm(hills, x / 45, y / 45, 3))).clone();
      const east = new THREE.Color().copy(grass).lerp(moss, fbm(biome, x / 90, y / 90, 2) * 0.8);
      return c.copy(west).lerp(east, t);
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;

    const area = visibleArea(w, h), pick = list => list[Math.floor(rng() * list.length)];
    const randomPoint = () => [area.x0 + rng() * (area.x1 - area.x0), area.y0 + rng() * (area.y1 - area.y0)];
    const dry = (x, y) => riftAt(x, y) > 60 && groundAt(x, y) > LAVA + 3;
    const capAt = (x, y, z) => (outsideBy(x, y, w, h) > 30 ? 200 : CEILING - z - 2);

    // enchanted trees and glowing mana crystals in the east
    const trees = [], crystals = [];
    for (let i = 0; i < 9000 && trees.length < 1100; i++) {
      const [x, y] = randomPoint(), z = groundAt(x, y), side = sideAt(x, y);
      if (!dry(x, y) || side < 0.15 + rng() * 0.2) continue;
      trees.push({ x, y, z, s: 13 + rng() * 9, rot: rng() * 6.3, color: pick(CANOPIES) });
    }
    for (let i = 0; i < 4000 && crystals.length < 45; i++) {
      const [x, y] = randomPoint(), z = groundAt(x, y);
      if (!dry(x, y) || sideAt(x, y) < 0.1) continue;
      const s = 4 + rng() * 5;
      crystals.push({ x, y, z, sx: s, sy: s, sz: s * 2.4, rot: rng() * 6.3 });
    }

    // spiked war camps of hide huts in the west
    const huts = [], spikes = [];
    for (let i = 0; i < 4000 && huts.length < 40; i++) {
      const [x, y] = randomPoint(), z = groundAt(x, y);
      if (!dry(x, y) || sideAt(x, y) > -0.2) continue;
      if (huts.some(o => Math.hypot(o.x - x, o.y - y) < 40)) continue;
      const s = 11 + rng() * 5;
      huts.push({ x, y, z, s, rot: rng() * 6.3, color: pick(HIDES) });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + rng() * 0.5, r = s * 0.95;
        spikes.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: z + s * 0.45, s: s * 0.5, rot: a });
      }
    }

    // a blue-roofed keep in the east and a stone portal in the west, both just
    // beyond the arena's far edge where they may tower over the action
    const towers = [], roofs = [], walls = [];
    const keep = { x: w * 0.32, y: h * 0.64 };
    const kz = groundAt(keep.x, keep.y);
    const towerAt = (dx, dy, r, height) => {
      const x = keep.x + dx, y = keep.y + dy, z = Math.min(groundAt(x, y), kz);
      const tall = Math.min(height, capAt(x, y, z));
      towers.push({ x, y, z, sx: r, sy: r, sz: tall, color: 0xb8b0a0 });
      roofs.push({ x, y, z: z + tall, sx: r * 1.3, sy: r * 1.3, sz: r * 1.8, color: 0x2f4f9a });
    };
    towerAt(0, 0, 18, 90);
    for (const [dx, dy] of [[-60, -40], [60, -40], [-60, 40], [60, 40]]) towerAt(dx, dy, 10, 55);
    for (const [dx, dy, sx, sy] of [[0, -40, 120, 8], [0, 40, 120, 8], [-60, 0, 8, 80], [60, 0, 8, 80]]) {
      const x = keep.x + dx, y = keep.y + dy;
      walls.push({ x, y, z: Math.min(groundAt(x, y), kz), sx, sy, sz: Math.min(30, capAt(x, y, kz)), color: 0xa8a090 });
    }

    const portal = { x: -w * 0.3, y: h * 0.68 };
    const pz = groundAt(portal.x, portal.y);
    for (const dx of [-62, 62]) towers.push({ x: portal.x + dx, y: portal.y, z: pz, sx: 14, sy: 14, sz: 120, color: 0x4a3a34 });
    walls.push({ x: portal.x, y: portal.y, z: pz + 116, sx: 150, sy: 18, sz: 14, color: 0x4a3a34 });
    walls.push({ x: portal.x, y: portal.y, z: pz, sx: 150, sy: 30, sz: 6, color: 0x3a2c28 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(48, 6, 8, 28).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3aff7a, emissive: 0x2aff5a, emissiveIntensity: 1.4, roughness: 0.4 }));
    ring.position.set(portal.x, portal.y, pz + 60);
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(44, 28).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1a6a3a, emissive: 0x1aaa4a, emissiveIntensity: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    swirl.position.copy(ring.position);

    const lava = new THREE.Mesh(new THREE.PlaneGeometry(w * 4, h * 4),
      new THREE.MeshStandardMaterial({ color: 0xc8441a, emissive: 0xff3a00, emissiveIntensity: 0.32, roughness: 0.6 }));
    lava.position.z = LAVA;

    const stone = () => new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
    return [
      terrain,
      lava,
      instanced(createMagicTreeGeometry(), stone(), trees),
      instanced(new THREE.OctahedronGeometry(0.5).translate(0, 0, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x6ae8ff, emissive: 0x2ab8ff, emissiveIntensity: 0.9, roughness: 0.3, flatShading: true }), crystals),
      instanced(createHutGeometry(), stone(), huts),
      instanced(new THREE.ConeGeometry(0.12, 1, 5).rotateZ(-Math.PI / 2).rotateY(-0.5).translate(0.3, 0, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6, flatShading: true }), spikes),
      instanced(new THREE.CylinderGeometry(1, 1.1, 1, 10).rotateX(Math.PI / 2).translate(0, 0, 0.5), stone(), towers),
      instanced(new THREE.ConeGeometry(1, 1, 10).rotateX(Math.PI / 2).translate(0, 0, 0.5), stone(), roofs),
      instanced(createBlockGeometry(), stone(), walls),
      ring,
      swirl,
    ];
  },
};

// Twisted trunk under a puffy faceted canopy, about 1.5 tall, base at z = 0.
function createMagicTreeGeometry() {
  return mergeFlat([
    new THREE.CylinderGeometry(0.06, 0.11, 0.7, 5).rotateX(Math.PI / 2).translate(0, 0, 0.35),
    new THREE.IcosahedronGeometry(0.42, 0).translate(0, 0, 0.95),
    new THREE.IcosahedronGeometry(0.3, 0).translate(0.22, 0.1, 1.25),
    new THREE.IcosahedronGeometry(0.26, 0).translate(-0.2, -0.12, 1.2),
  ]);
}

// Round hide hut with a squat conical roof, radius 1, base at z = 0.
function createHutGeometry() {
  return mergeFlat([
    new THREE.CylinderGeometry(0.85, 0.95, 0.5, 8).rotateX(Math.PI / 2).translate(0, 0, 0.25),
    new THREE.ConeGeometry(1.05, 0.7, 8).rotateX(Math.PI / 2).translate(0, 0, 0.85),
  ]);
}
