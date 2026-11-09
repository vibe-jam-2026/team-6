import * as THREE from 'three';

// The glowing border around the play area; rebuilt when the window resizes.
// The ground below is drawn by the Scenery.
export class ArenaView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  build({ width: w, height: h }) {
    this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    this.group.clear();
    const border = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, -h / 2, 0),
        new THREE.Vector3(w / 2, h / 2, 0), new THREE.Vector3(-w / 2, h / 2, 0),
      ]),
      new THREE.LineBasicMaterial({ color: new THREE.Color(0x3d6bff).multiplyScalar(1.6) }));
    this.group.add(border);
  }
}
