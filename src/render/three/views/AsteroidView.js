import * as THREE from 'three';
import { rand, TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';
import { mergeFlat, plate, alongX } from '../geometry.js';

// The "asteroids" are skinned as enemy airships, aircraft and birds. Gameplay is
// unchanged: large ones are zeppelins, medium ones fighters, small ones birds,
// and they still split when shot. Models are built at unit size (about 2 long)
// and scaled up to the hit radius.

const mirrorY = pts => [...pts, ...pts.slice().reverse().map(([x, y]) => [x, -y])];

// Zeppelin: a cigar-shaped envelope with cruciform tail fins, a control
// gondola and two engine cars underneath.
const envelopeGeometry = new THREE.SphereGeometry(1, 16, 10).scale(1, 0.3, 0.3);
const bandGeometry = mergeFlat([-0.45, 0.45].map(x =>
  alongX(new THREE.CylinderGeometry(0.3 * Math.sqrt(1 - x * x) + 0.006, 0.3 * Math.sqrt(1 - x * x) + 0.006, 0.07, 16, 1, true)).translate(x, 0, 0)));
const finGeometry = mergeFlat([0, 1, 2, 3].map(k =>
  plate([[-0.62, 0.08], [-0.92, 0.34], [-1.02, 0.34], [-0.98, 0.08]], 0.025).rotateX(k * Math.PI / 2)));
const gondolaGeometry = mergeFlat([
  new THREE.BoxGeometry(0.34, 0.1, 0.09).translate(0.22, 0, -0.32),
  new THREE.BoxGeometry(0.06, 0.04, 0.06).translate(0.22, 0, -0.27),
  ...[-1, 1].map(s => alongX(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8)).translate(-0.3, s * 0.24, -0.22)),
  ...[-1, 1].map(s => new THREE.BoxGeometry(0.03, 0.06, 0.06).translate(-0.3, s * 0.15, -0.21)),
]);
const propellerGeometry = new THREE.BoxGeometry(0.01, 0.22, 0.025);

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

const edgeGeometries = new Map();
const edgesFor = g => {
  if (!edgeGeometries.has(g)) edgeGeometries.set(g, new THREE.EdgesGeometry(g, 30));
  return edgeGeometries.get(g);
};

const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b5244, emissive: 0x2a0606, metalness: 0.5, roughness: 0.55, flatShading: true, side: THREE.DoubleSide,
});
const envelopeMaterial = new THREE.MeshStandardMaterial({ color: 0xa9a69c, emissive: 0x1a0404, metalness: 0.35, roughness: 0.55, flatShading: true });
const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xb02a22, emissive: 0x3a0806, roughness: 0.6, flatShading: true, side: THREE.DoubleSide });
const gondolaMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.4, roughness: 0.6, flatShading: true });
const planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.6 });
const engineMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xff6a2a).multiplyScalar(1.6), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
});
const engineGeometry = new THREE.ConeGeometry(0.07, 1, 8).rotateZ(Math.PI / 2).translate(-0.5, 0, 0);
const birdMaterial = new THREE.MeshStandardMaterial({ color: 0xeceae2, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xf0a020, roughness: 0.6, flatShading: true });

const mesh = (geometry, material) => {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
};

function createZeppelin() {
  const body = mesh(envelopeGeometry, envelopeMaterial);
  body.add(mesh(bandGeometry, markingMaterial), mesh(finGeometry, markingMaterial), mesh(gondolaGeometry, gondolaMaterial));
  body.add(new THREE.LineSegments(edgesFor(finGeometry), planeEdgeMaterial));
  const propellers = [-1, 1].map(s => {
    const prop = mesh(propellerGeometry, gondolaMaterial);
    prop.position.set(-0.39, s * 0.24, -0.22);
    body.add(prop);
    return prop;
  });
  return { body, exhausts: [], wings: [], propellers, sway: 0.05 };
}

function createFighter() {
  const body = mesh(fighterGeometry, planeMaterial);
  body.add(new THREE.LineSegments(edgesFor(fighterGeometry), planeEdgeMaterial));
  const flame = new THREE.Mesh(engineGeometry, engineMaterial);
  flame.position.set(-0.92, 0, 0);
  body.add(flame);
  return { body, exhausts: [flame], wings: [], propellers: [], sway: 0.25 };
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
  return { body, exhausts: [], wings, propellers: [], sway: 0.25 };
}

export class AsteroidView {
  constructor(asteroid) {
    const model = [null, createBird, createFighter, createZeppelin][asteroid.size]();
    Object.assign(this, model);
    this.object = new THREE.Group();
    this.object.rotation.order = 'ZYX'; // yaw to the flight direction, then bank
    this.object.add(this.body);
    this.object.scale.setScalar(asteroid.radius * (asteroid.size === 1 ? 1.1 : 1));
    this.phase = rand(0, TAU);
    this.flapSpeed = rand(9, 13);
  }

  update(a, { t, bounds }) {
    const bob = Math.sin(t * 2 + this.phase) * (a.size === 1 ? 4 : 2);
    this.object.position.set(toSceneX(bounds, a.x), toSceneY(bounds, a.y), 4 + bob);
    // Game y points down and scene y up, so the heading flips sign.
    this.object.rotation.set(Math.sin(t * 1.3 + this.phase) * this.sway, 0, Math.atan2(-a.vy, a.vx));
    const flap = Math.sin(t * this.flapSpeed + this.phase) * 0.75;
    for (const wing of this.wings) wing.rotation.x = flap * wing.userData.side;
    for (const prop of this.propellers) prop.rotation.x = t * 25 + this.phase;
    for (const flame of this.exhausts) flame.scale.set(0.15 + Math.random() * 0.12, 0.8, 0.8);
  }
}
