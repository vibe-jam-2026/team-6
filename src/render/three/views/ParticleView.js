import * as THREE from 'three';
import { toSceneX, toSceneY } from '../coords.js';

const MAX_PARTICLES = 6000;

// All particles in one additive point cloud; brightness fades with remaining life.
export class ParticleView {
  #colors = new Map();

  constructor(texture) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.object = new THREE.Points(this.geometry, new THREE.PointsMaterial({
      size: 10, map: texture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.object.frustumCulled = false;
  }

  #color(hex) {
    if (!this.#colors.has(hex)) this.#colors.set(hex, new THREE.Color(hex).multiplyScalar(2.2));
    return this.#colors.get(hex);
  }

  update(particles, bounds) {
    const n = Math.min(particles.length, MAX_PARTICLES);
    for (let i = 0; i < n; i++) {
      const p = particles[i], k = Math.max(0, p.life / p.max), c = this.#color(p.color);
      this.positions.set([toSceneX(bounds, p.x), toSceneY(bounds, p.y), p.z], i * 3);
      this.colors.set([c.r * k, c.g * k, c.b * k], i * 3);
    }
    this.geometry.setDrawRange(0, n);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
