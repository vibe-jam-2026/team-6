import * as THREE from 'three';
import { rand, TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';
import { mergeFlat, plate, alongX } from '../geometry.js';

// The "asteroids" are skinned as enemy aircraft and birds (over the fantasy
// realm all of them become fish-folk). Gameplay is
// unchanged: large ones are bombers, medium ones fighters, small ones birds,
// and they still split when shot. Models are built at unit size (about 2 long)
// and scaled up to the hit radius.

const mirrorY = pts => [...pts, ...pts.slice().reverse().map(([x, y]) => [x, -y])];

const bomberGeometry = mergeFlat([
  alongX(new THREE.CylinderGeometry(0.12, 0.1, 1.7, 10)).translate(-0.1, 0, 0),
  alongX(new THREE.ConeGeometry(0.12, 0.3, 10)).translate(0.9, 0, 0),
  plate(mirrorY([[0.3, 0.12], [-0.2, 1.05], [-0.38, 1.05], [-0.12, 0.12]]), 0.05).translate(0, 0, -0.03),
  ...[-0.7, -0.4, 0.4, 0.7].map(y => alongX(new THREE.CylinderGeometry(0.05, 0.065, 0.32, 8)).translate(0.12 - Math.abs(y) * 0.45, y, -0.08)),
  plate(mirrorY([[-0.7, 0.1], [-0.88, 0.42], [-0.98, 0.42], [-0.95, 0.1]]), 0.04),
  plate([[-0.62, 0], [-0.92, 0.38], [-1.0, 0.38], [-0.98, 0]], 0.04).rotateX(Math.PI / 2).translate(0, 0, 0.08),
]);

const fighterGeometry = mergeFlat([
  alongX(new THREE.CylinderGeometry(0.12, 0.14, 1.3, 8)).translate(-0.25, 0, 0),
  alongX(new THREE.ConeGeometry(0.12, 0.5, 8)).translate(0.65, 0, 0),
  plate(mirrorY([[0.3, 0.12], [-0.35, 0.8], [-0.5, 0.8], [-0.45, 0.12]]), 0.05),
  plate(mirrorY([[-0.62, 0.12], [-0.85, 0.42], [-0.95, 0.42], [-0.92, 0.12]]), 0.04),
  ...[-1, 1].map(s => plate([[-0.5, 0], [-0.82, 0.38], [-0.92, 0.38], [-0.9, 0]], 0.04)
    .rotateX(Math.PI / 2).rotateX(s * 0.25).translate(0, s * 0.12, 0.08)),
]);

const birdBodyGeometry = mergeFlat([
  new THREE.SphereGeometry(1, 8, 6).scale(0.5, 0.2, 0.2),
  new THREE.SphereGeometry(0.15, 8, 6).translate(0.48, 0, 0.08),
  plate([[-0.35, 0], [-0.8, 0.22], [-0.8, -0.22]], 0.03),
]);
const beakGeometry = alongX(new THREE.ConeGeometry(0.06, 0.22, 6)).translate(0.7, 0, 0.06);
const wingGeometry = plate([[0.22, 0], [0.12, 0.6], [-0.05, 1.05], [-0.22, 0.75], [-0.28, 0]], 0.03);

const PLANES = { 3: bomberGeometry, 2: fighterGeometry };
const edgeGeometries = new Map();
const edgesFor = g => {
  if (!edgeGeometries.has(g)) edgeGeometries.set(g, new THREE.EdgesGeometry(g, 30));
  return edgeGeometries.get(g);
};

const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b5244, emissive: 0x2a0606, metalness: 0.5, roughness: 0.55, flatShading: true, side: THREE.DoubleSide,
});
const planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.6 });
const engineMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xff6a2a).multiplyScalar(1.6), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
});
const engineGeometry = new THREE.ConeGeometry(0.07, 1, 8).rotateZ(Math.PI / 2).translate(-0.5, 0, 0);
const birdMaterial = new THREE.MeshStandardMaterial({ color: 0xeceae2, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xf0a020, roughness: 0.6, flatShading: true });

function createPlane(size) {
  const geometry = PLANES[size];
  const body = new THREE.Mesh(geometry, planeMaterial);
  body.castShadow = true;
  body.add(new THREE.LineSegments(edgesFor(geometry), planeEdgeMaterial));
  const exhausts = (size === 3 ? [-0.7, -0.4, 0.4, 0.7].map(y => [-0.04 - Math.abs(y) * 0.45, y, -0.08]) : [[-0.92, 0, 0]])
    .map(([x, y, z]) => {
      const flame = new THREE.Mesh(engineGeometry, engineMaterial);
      flame.position.set(x, y, z);
      body.add(flame);
      return flame;
    });
  return { body, exhausts, wings: [] };
}

function createBird() {
  const body = new THREE.Mesh(birdBodyGeometry, birdMaterial);
  body.castShadow = true;
  body.add(new THREE.Mesh(beakGeometry, beakMaterial));
  const wings = [1, -1].map(side => {
    const hinge = new THREE.Group();
    hinge.position.y = side * 0.12;
    hinge.scale.y = side; // the right wing is the left one mirrored
    hinge.userData.side = side;
    const wing = new THREE.Mesh(wingGeometry, birdMaterial);
    wing.castShadow = true;
    hinge.add(wing);
    body.add(hinge);
    return hinge;
  });
  return { body, exhausts: [], wings };
}

// Fish-folk raiders that take the planes' place above the fantasy realm: a
// scaly body with bulging eyes, a back fin, a tail fluke and fin-arms that
// paddle through the air like wings. Original design, nose along +x.
const fishBodyGeometry = mergeFlat([
  new THREE.SphereGeometry(1, 10, 7).scale(0.5, 0.26, 0.22),
  new THREE.SphereGeometry(0.27, 10, 7).scale(1, 1.05, 0.85).translate(0.5, 0, 0.04),
  ...[-1, 1].map(s => alongX(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 5)).translate(-0.62, s * 0.12, -0.04)),
]);
const fishFinGeometry = mergeFlat([
  plate([[-0.38, 0], [0.32, 0], [0.12, 0.2], [-0.05, 0.3], [-0.25, 0.22]], 0.03).rotateX(Math.PI / 2).translate(0, 0, 0.14),
  plate(mirrorY([[-0.42, 0], [-0.98, 0.34], [-0.86, 0.06]]), 0.03),
  ...[-1, 1].map(s => plate(mirrorY([[-0.8, 0.02], [-0.98, 0.1], [-0.95, 0.02]]), 0.02).translate(0, s * 0.12, -0.04)),
]);
const fishEyeGeometry = mergeFlat([-1, 1].map(s => new THREE.SphereGeometry(0.095, 8, 6).translate(0.62, s * 0.15, 0.17)));
const fishPupilGeometry = mergeFlat([-1, 1].map(s => new THREE.SphereGeometry(0.045, 6, 5).translate(0.69, s * 0.17, 0.22)));
const fishMouthGeometry = plate(mirrorY([[0.78, 0], [0.66, 0.13], [0.62, 0.12]]), 0.03).translate(0, 0, -0.02);
const fishArmGeometry = plate([[0.16, 0], [0.1, 0.45], [0.02, 0.7], [-0.12, 0.62], [-0.2, 0.36], [-0.16, 0]], 0.03);

const scaleMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6aa8, emissive: 0x061428, roughness: 0.5, metalness: 0.1, flatShading: true });
const youngScaleMaterial = new THREE.MeshStandardMaterial({ color: 0x2fa89a, emissive: 0x06201c, roughness: 0.5, metalness: 0.1, flatShading: true });
const finMaterial = new THREE.MeshStandardMaterial({ color: 0xf0b030, roughness: 0.6, flatShading: true, side: THREE.DoubleSide });
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f2e8, roughness: 0.3 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x14080c, roughness: 0.5, side: THREE.DoubleSide });

// The small ones (the birds elsewhere) are teal youngsters.
function createFishFolk(young = false) {
  const body = new THREE.Mesh(fishBodyGeometry, young ? youngScaleMaterial : scaleMaterial);
  body.castShadow = true;
  for (const [g, m] of [[fishFinGeometry, finMaterial], [fishEyeGeometry, eyeMaterial], [fishPupilGeometry, darkMaterial], [fishMouthGeometry, darkMaterial]]) {
    const part = new THREE.Mesh(g, m);
    part.castShadow = true;
    body.add(part);
  }
  const wings = [1, -1].map(side => {
    const hinge = new THREE.Group();
    hinge.position.set(0.12, side * 0.2, 0);
    hinge.scale.y = side;
    hinge.userData.side = side;
    const arm = new THREE.Mesh(fishArmGeometry, finMaterial);
    arm.castShadow = true;
    hinge.add(arm);
    body.add(hinge);
    return hinge;
  });
  return { body, exhausts: [], wings };
}

export class AsteroidView {
  constructor(asteroid, scenery) {
    const model = scenery === 'realm' ? createFishFolk(asteroid.size === 1)
      : asteroid.size === 1 ? createBird()
        : createPlane(asteroid.size);
    Object.assign(this, model);
    this.object = new THREE.Group();
    this.object.rotation.order = 'ZYX'; // yaw to the flight direction, then bank
    this.object.add(this.body);
    this.object.scale.setScalar(asteroid.radius * (asteroid.size === 1 ? 1.1 : 1));
    this.phase = rand(0, TAU);
    this.flapSpeed = asteroid.size === 1 ? rand(9, 13) : rand(5, 7);
  }

  update(a, { t, bounds }) {
    const bob = Math.sin(t * 2 + this.phase) * (a.size === 1 ? 4 : 2);
    this.object.position.set(toSceneX(bounds, a.x), toSceneY(bounds, a.y), 4 + bob);
    // Game y points down and scene y up, so the heading flips sign.
    this.object.rotation.set(Math.sin(t * 1.3 + this.phase) * 0.25, 0, Math.atan2(-a.vy, a.vx));
    const flap = Math.sin(t * this.flapSpeed + this.phase) * 0.75;
    for (const wing of this.wings) wing.rotation.x = flap * wing.userData.side;
    for (const flame of this.exhausts) flame.scale.set(0.15 + Math.random() * 0.12, 0.8, 0.8);
  }
}
