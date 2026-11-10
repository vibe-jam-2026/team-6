import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';
import { mergeFlat } from '../geometry.js';

// An anti-aircraft gun emplacement: a concrete pad ringed with sandbags, a
// turret that swings towards its target and twin barrels raised at the sky.
// It sits on the landscape (groundAt gives the height under it), kicks back
// when it fires and flashes when hit. Model space: barrels point along +x.
const padGeometry = new THREE.CylinderGeometry(1, 1.1, 0.35, 8).rotateX(Math.PI / 2).translate(0, 0, 0.17);
const pillarGeometry = new THREE.CylinderGeometry(1.05, 1.05, 1, 8).rotateX(Math.PI / 2).translate(0, 0, -0.5);
const sandbagGeometry = new THREE.TorusGeometry(0.95, 0.16, 5, 14).translate(0, 0, 0.42);
const turretGeometry = mergeFlat([
  new THREE.CylinderGeometry(0.42, 0.5, 0.36, 8).rotateX(Math.PI / 2).translate(0, 0, 0.55),
  new THREE.BoxGeometry(0.5, 0.62, 0.32).translate(0.08, 0, 0.82),
]);
const barrelGeometry = mergeFlat([-0.15, 0.15].map(y =>
  new THREE.CylinderGeometry(0.055, 0.07, 1.05, 6).rotateZ(-Math.PI / 2).translate(0.55, y, 0)));
const ringGeometry = new THREE.TorusGeometry(1.18, 0.045, 4, 32).translate(0, 0, 0.36);
const lampGeometry = new THREE.SphereGeometry(0.09, 6, 4).translate(-0.1, 0, 1.02);
const flashGeometry = new THREE.ConeGeometry(0.22, 0.6, 8).rotateZ(-Math.PI / 2).translate(1.35, 0, 0);

const concrete = new THREE.MeshStandardMaterial({ color: 0x6d6a64, roughness: 0.95, flatShading: true });
const sandbags = new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 1, flatShading: true });
const steel = new THREE.MeshStandardMaterial({ color: 0x3b4038, metalness: 0.5, roughness: 0.5, flatShading: true });
const lampMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a20).multiplyScalar(3) });
const flashMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xffc060).multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const ringMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff4a3a).multiplyScalar(1.8) });
const ELEVATION = 0.75; // barrels tilted up this many radians
const SCALE = 30;

export class GroundTargetView {
  // groundAt(sceneX, sceneY) -> height of the landscape there
  constructor(gun, groundAt) {
    this.groundAt = groundAt;
    this.object = new THREE.Group();
    this.object.scale.setScalar(SCALE);
    const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };
    this.turretMaterial = steel.clone();
    this.turret = new THREE.Group();
    this.turret.add(mesh(turretGeometry, this.turretMaterial), new THREE.Mesh(lampGeometry, lampMaterial));
    this.barrels = new THREE.Group();
    this.barrels.position.set(0.2, 0, 0.85);
    this.barrels.rotation.y = -ELEVATION;
    this.flash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.barrels.add(mesh(barrelGeometry, steel), this.flash);
    this.turret.add(this.barrels);
    this.object.add(mesh(padGeometry, concrete), mesh(pillarGeometry, concrete), mesh(sandbagGeometry, sandbags),
      new THREE.Mesh(ringGeometry, ringMaterial), this.turret);
    this.lastHp = gun.hp;
    this.hitFlash = 0;
  }

  update(gun, { bounds }) {
    const x = toSceneX(bounds, gun.x), y = toSceneY(bounds, gun.y);
    this.object.position.set(x, y, this.groundAt(x, y));
    // game y points down, scene y up
    this.turret.rotation.z = -gun.aim;
    this.barrels.position.x = 0.2 - gun.recoil * 0.18;
    this.flash.visible = gun.recoil > 0.65;
    if (gun.hp < this.lastHp) this.hitFlash = 1;
    this.lastHp = gun.hp;
    this.hitFlash = Math.max(0, this.hitFlash - 0.08);
    this.turretMaterial.emissive.setRGB(this.hitFlash, this.hitFlash * 0.6, this.hitFlash * 0.4);
  }

  dispose() { this.turretMaterial.dispose(); }
}
