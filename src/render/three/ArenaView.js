import * as THREE from 'three';

const FLOOR_DEPTH = -60;
const GRID_STEP = 80;

// Shadow-catching floor, grid and glowing border; rebuilt when the window resizes.
export class ArenaView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  build({ width: w, height: h }) {
    this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    this.group.clear();

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShadowMaterial({ opacity: 0.55 }));
    floor.position.z = FLOOR_DEPTH;
    floor.receiveShadow = true;

    const tint = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: 0x0a1030, transparent: true, opacity: 0.45, depthWrite: false }));
    tint.position.z = FLOOR_DEPTH - 1;

    const pts = [];
    for (let x = -w / 2; x <= w / 2 + 0.1; x += GRID_STEP) pts.push(x, -h / 2, FLOOR_DEPTH, x, h / 2, FLOOR_DEPTH);
    for (let y = -h / 2; y <= h / 2 + 0.1; y += GRID_STEP) pts.push(-w / 2, y, FLOOR_DEPTH, w / 2, y, FLOOR_DEPTH);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x1d2a5a, transparent: true, opacity: 0.7 }));

    const border = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, -h / 2, 0),
        new THREE.Vector3(w / 2, h / 2, 0), new THREE.Vector3(-w / 2, h / 2, 0),
      ]),
      new THREE.LineBasicMaterial({ color: new THREE.Color(0x3d6bff).multiplyScalar(1.6) }));

    this.group.add(floor, tint, grid, border);
  }
}
