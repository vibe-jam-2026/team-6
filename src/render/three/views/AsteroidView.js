import * as THREE from 'three';
import { rand, TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';
import { mergeFlat, plate, alongX } from '../geometry.js';

// The "asteroids" are skinned as enemy airships, aircraft and drones (over the fantasy
// realm all of them become fish-folk). Gameplay is
// unchanged: large ones are zeppelins, medium ones fighters, small ones drones,
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

// Quadcopter drone: a flat body with a camera, four arms with motors and
// spinning rotors, and red LEDs.
const ARM = 0.68;
const ARM_ANGLES = [1, 3, 5, 7].map(k => k * Math.PI / 4);
const droneBodyGeometry = mergeFlat([
  new THREE.BoxGeometry(0.5, 0.34, 0.14),
  new THREE.SphereGeometry(0.17, 10, 6).scale(1.2, 1, 0.5).translate(-0.02, 0, 0.07),
  new THREE.BoxGeometry(0.12, 0.2, 0.06).translate(-0.12, 0, -0.09), // battery
  ...ARM_ANGLES.map(a => new THREE.BoxGeometry(ARM, 0.06, 0.045).translate(ARM / 2, 0, 0).rotateZ(a)),
  ...ARM_ANGLES.map(a => new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8).rotateX(Math.PI / 2)
    .translate(Math.cos(a) * ARM, Math.sin(a) * ARM, 0.03)),
  ...ARM_ANGLES.map(a => new THREE.BoxGeometry(0.03, 0.03, 0.14).translate(Math.cos(a) * ARM, Math.sin(a) * ARM, -0.08)), // legs
]);
const cameraGeometry = new THREE.SphereGeometry(0.075, 8, 6).translate(0.24, 0, -0.08);
const bladeGeometry = new THREE.BoxGeometry(0.56, 0.045, 0.012);
const rotorDiscGeometry = new THREE.CircleGeometry(0.3, 18);
const ledGeometry = new THREE.SphereGeometry(0.035, 6, 4);

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
const droneMaterial = new THREE.MeshStandardMaterial({ color: 0x2e3138, metalness: 0.5, roughness: 0.45, flatShading: true });
const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0e14, metalness: 0.9, roughness: 0.1 });
const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: 0.5, flatShading: true });
const rotorDiscMaterial = new THREE.MeshBasicMaterial({ color: 0xc8d0dc, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
const ledMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a20).multiplyScalar(3) });

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
  return { body, exhausts: [], propellers, sway: 0.05 };
}

function createFighter() {
  const body = mesh(fighterGeometry, planeMaterial);
  body.add(new THREE.LineSegments(edgesFor(fighterGeometry), planeEdgeMaterial));
  const flame = new THREE.Mesh(engineGeometry, engineMaterial);
  flame.position.set(-0.92, 0, 0);
  body.add(flame);
  return { body, exhausts: [flame], propellers: [], sway: 0.25 };
}

function createDrone() {
  const body = mesh(droneBodyGeometry, droneMaterial);
  body.add(new THREE.LineSegments(edgesFor(droneBodyGeometry), planeEdgeMaterial), mesh(cameraGeometry, lensMaterial));
  const rotors = ARM_ANGLES.map((a, i) => {
    const hub = new THREE.Group();
    hub.position.set(Math.cos(a) * ARM, Math.sin(a) * ARM, 0.09);
    hub.userData.spin = i % 2 ? 1 : -1; // neighbouring rotors turn opposite ways
    const blades = mesh(bladeGeometry, bladeMaterial);
    hub.add(blades, new THREE.Mesh(rotorDiscGeometry, rotorDiscMaterial));
    if (Math.cos(a) > 0) {
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.z = -0.05;
      hub.add(led);
    }
    body.add(hub);
    return hub;
  });
  return { body, exhausts: [], rotors, propellers: [], sway: 0.12, pitch: 0.22 };
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

// The small ones (the drones elsewhere) are teal youngsters.
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
  return { body, exhausts: [], wings, propellers: [], sway: 0.25 };
}

export class AsteroidView {
  constructor(asteroid, scenery) {
    const model = scenery === 'realm' ? createFishFolk(asteroid.size === 1)
      : [null, createDrone, createFighter, createZeppelin][asteroid.size]();
    Object.assign(this, model);
    this.object = new THREE.Group();
    this.object.rotation.order = 'ZYX'; // yaw to the flight direction, then bank
    this.object.add(this.body);
    this.object.scale.setScalar(asteroid.radius * (asteroid.size === 1 ? 1.25 : 1));
    this.phase = rand(0, TAU);
    this.flapSpeed = asteroid.size === 1 ? rand(9, 13) : rand(5, 7);
  }

  update(a, { t, bounds }) {
    const bob = Math.sin(t * 2 + this.phase) * (a.size === 1 ? 3 : 2);
    this.object.position.set(toSceneX(bounds, a.x), toSceneY(bounds, a.y), 4 + bob);
    // Game y points down and scene y up, so the heading flips sign.
    this.object.rotation.set(Math.sin(t * 1.3 + this.phase) * this.sway, this.pitch ?? 0, Math.atan2(-a.vy, a.vx));
    for (const rotor of this.rotors ?? []) rotor.rotation.z = rotor.userData.spin * (t * 40 + this.phase);
    const flap = Math.sin(t * this.flapSpeed + this.phase) * 0.75;
    for (const wing of this.wings ?? []) wing.rotation.x = flap * wing.userData.side;
    for (const prop of this.propellers) prop.rotation.x = t * 25 + this.phase;
    for (const flame of this.exhausts) flame.scale.set(0.15 + Math.random() * 0.12, 0.8, 0.8);
  }
}
