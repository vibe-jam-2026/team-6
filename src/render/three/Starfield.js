import * as THREE from 'three';
import { rand } from '../../core/math.js';

export function createStarfield(texture, count = 2500) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([rand(-6000, 6000), rand(-5000, 7000), rand(-3500, -900)], i * 3);
    const c = rand(0.35, 1);
    col.set([c * 0.85, c * 0.9, c], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 9, map: texture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}
