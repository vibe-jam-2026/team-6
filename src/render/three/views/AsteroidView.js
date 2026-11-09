import * as THREE from 'three';
import { rand, TAU } from '../../../core/math.js';
import { toSceneX, toSceneY } from '../coords.js';

const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x7d8496, roughness: 0.92, metalness: 0.05, flatShading: true });
const rockEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x8fa6e0, transparent: true, opacity: 0.35 });

// An icosahedron with randomly pushed-in/out corners, so every rock is unique.
function createRockGeometry(radius, detail) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position, bumps = new Map(), v = new THREE.Vector3();
  const squash = [rand(0.8, 1.15), rand(0.8, 1.15), rand(0.7, 1)];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // the same corner appears in several triangles; displace it the same way each time
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!bumps.has(key)) bumps.set(key, rand(0.72, 1.12));
    v.multiplyScalar(bumps.get(key) * radius);
    pos.setXYZ(i, v.x * squash[0], v.y * squash[1], v.z * squash[2]);
  }
  g.computeVertexNormals();
  return g;
}

export class AsteroidView {
  constructor(asteroid) {
    this.geometry = createRockGeometry(asteroid.radius, asteroid.size === 1 ? 0 : 1);
    this.edges = new THREE.EdgesGeometry(this.geometry, 20);
    this.object = new THREE.Mesh(this.geometry, rockMaterial);
    this.object.castShadow = true;
    this.object.receiveShadow = true;
    this.object.add(new THREE.LineSegments(this.edges, rockEdgeMaterial));
    this.offset = new THREE.Euler(rand(0, TAU), rand(0, TAU), 0);
  }

  update(a, { bounds }) {
    this.object.position.set(toSceneX(bounds, a.x), toSceneY(bounds, a.y), 0);
    this.object.rotation.set(this.offset.x + a.tumbleX, this.offset.y + a.tumbleY, -a.angle);
  }

  dispose() {
    this.geometry.dispose();
    this.edges.dispose();
  }
}
