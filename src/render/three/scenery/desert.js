import * as THREE from 'three';
import { valueNoise, fbm, seededRandom, smoothstep } from './noise.js';
import { mergeFlat } from '../geometry.js';
import { BASE, CEILING, outsideBy, visibleArea, createTerrain, createWater, instanced, createBlockGeometry } from './terrain.js';

const OASIS = BASE + 2;

// Square pyramid, base 1 x 1 at z = 0, apex at z = 1.
const pyramidGeometry = () => new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).translate(0, 0, 0.5);

// Date palm about 1.6 tall: a leaning trunk and a crown of drooping fronds.
const palmTrunkGeometry = () => new THREE.CylinderGeometry(0.05, 0.08, 1.3, 6).rotateX(Math.PI / 2).rotateY(0.15).translate(0.1, 0, 0.65);
const palmCrownGeometry = () => mergeFlat([0, 1, 2, 3, 4, 5].map(k =>
  new THREE.ConeGeometry(0.12, 0.8, 4).rotateZ(Math.PI / 2).rotateX(0.2).translate(0.42, 0, -0.12)
    .rotateZ(k * Math.PI / 3).translate(0.2, 0, 1.32)));

// Sahara: rolling dunes in long sweeping ridges, an oasis of palms and
// mud-brick houses, and the great pyramids on the horizon.
export const desert = {
  mood: { sky: 0xd6a466, hemiSky: 0xffe4b8, hemiGround: 0x8a6438, hemi: 1.05, sun: 0xfff0d2, sunIntensity: 2.5 },

  build(w, h) {
    const dunes = valueNoise(61), oases = valueNoise(62), rng = seededRandom(6);
    const oasisAt = (x, y) => fbm(oases, x / 320, y / 320, 3);
    const heightAt = (x, y) => {
      // 1 - |sin| gives sharp dune crests with long smooth troughs
      const crest = 1 - Math.abs(Math.sin((x * 0.8 + y * 0.6) / 95 + fbm(dunes, x / 340, y / 340, 3) * 7));
      const far = outsideBy(x, y, w, h) * 0.12 * (y < -h / 2 ? 0.3 : 1);
      return BASE + 3 + crest ** 1.6 * 13 + far - smoothstep(0.6, 0.68, oasisAt(x, y)) * 13;
    };
    const sandLight = new THREE.Color(0xe2bd7c), sandDark = new THREE.Color(0xb38449), grass = new THREE.Color(0x5f7a34), mud = new THREE.Color(0x8a6a44);
    const colorAt = (x, y, z, c) => {
      const o = oasisAt(x, y);
      if (z < OASIS + 1.5) return c.copy(mud);
      if (o > 0.56) return c.copy(grass).lerp(sandDark, smoothstep(0.62, 0.56, o));
      return c.copy(sandDark).lerp(sandLight, Math.min(1, (z - BASE - 3) / 12));
    };
    const terrain = createTerrain(w, h, heightAt, colorAt);
    const groundAt = terrain.userData.groundAt;
    const area = visibleArea(w, h);
    const randomPoint = () => [area.x0 + rng() * (area.x1 - area.x0), area.y0 + rng() * (area.y1 - area.y0)];

    // palms and houses ring the oases
    const palms = [], houses = [];
    for (let i = 0; i < 6000 && palms.length < 260; i++) {
      const [x, y] = randomPoint(), o = oasisAt(x, y), z = groundAt(x, y);
      if (o < 0.55 || z < OASIS + 1) continue;
      palms.push({ x, y, z, s: 12 + rng() * 6, rot: rng() * 6.3 });
      if (houses.length < 30 && o < 0.6 && rng() < 0.25) {
        houses.push({ x: x + 14, y: y + 8, z, sx: 10 + rng() * 6, sy: 9 + rng() * 5, sz: 6 + rng() * 3, rot: rng() * 1.5, color: rng() < 0.5 ? 0xc79a62 : 0xd8b07a });
      }
    }

    // the pyramids stand outside the arena to the north, where there is room for them
    const pyramids = [[-0.25, 0.85, 150], [0.05, 0.95, 190], [0.32, 0.82, 120]].map(([fx, fy, size]) => {
      const x = fx * w, y = fy * h, z = groundAt(x, y);
      const cap = outsideBy(x, y, w, h) > 40 ? size * 0.65 : CEILING - z - 2;
      return { x, y, z: z - 2, sx: size, sy: size, sz: Math.max(4, cap), color: 0xd9b27a };
    });

    const mat = opts => new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, ...opts });
    return [
      terrain,
      createWater(w, h, OASIS, 0x2c7a74),
      instanced(palmTrunkGeometry(), mat({ color: 0x7a5a3a }), palms),
      instanced(palmCrownGeometry(), mat({ color: 0x3f7a2c }), palms),
      instanced(createBlockGeometry(), mat(), houses),
      instanced(pyramidGeometry(), mat(), pyramids),
    ];
  },
};
