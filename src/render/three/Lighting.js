import * as THREE from 'three';

// Sky light, a shadow-casting key light and a cool rim light.
export class Lighting {
  constructor(scene) {
    scene.add(new THREE.HemisphereLight(0x8aa4ff, 0x1a1020, 0.9));
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun, this.sun.target);
    const rim = new THREE.DirectionalLight(0x6a7dff, 0.9);
    rim.position.set(400, 600, -300);
    scene.add(rim);
  }

  // keep the key light and its shadow camera covering the whole arena
  fit({ width: w, height: h }) {
    this.sun.position.set(-w * 0.25, h * 0.35, 1200);
    this.sun.target.position.set(0, 0, 0);
    const sc = this.sun.shadow.camera;
    Object.assign(sc, { left: -w * 0.75, right: w * 0.75, top: h * 0.75, bottom: -h * 0.75, near: 100, far: 3000 });
    sc.updateProjectionMatrix();
  }
}
