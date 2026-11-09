import * as THREE from 'three';
import { mergeFlat } from '../geometry.js';

// Shared building blocks for the landscapes under the arena. The play plane
// is z = 0; the ground lies around BASE and must stay below CEILING inside
// the arena so nothing pokes through the action. Outside the arena it may
// rise, more steeply away from the camera (north) than towards it (south).
export const BASE = -60;
export const CEILING = -16;

export const outsideBy = (x, y, w, h) => Math.hypot(Math.max(0, Math.abs(x) - w / 2), Math.max(0, Math.abs(y) - h / 2));
export const ceilingAt = (x, y, w, h) => CEILING + outsideBy(x, y, w, h) * (y < -h / 2 ? 0.6 : 3);

// The part of the landscape the tilted camera can actually see.
export const visibleArea = (w, h) => ({ x0: -w * 0.8, x1: w * 0.8, y0: -h * 0.75, y1: h * 1.25 });

// A height-mapped, vertex-coloured ground mesh four times the arena's size.
export function createTerrain(w, h, heightAt, colorAt, segments = 230) {
  const W = w * 4, H = h * 4;
  const geometry = new THREE.PlaneGeometry(W, H, segments, Math.round(segments * H / W));
  const pos = geometry.attributes.position, colors = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = Math.min(heightAt(x, y), ceilingAt(x, y, w, h));
    pos.setZ(i, z);
    colorAt(x, y, z, c);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  mesh.receiveShadow = true;
  // ground height used for placing props, clamped the same way as the mesh
  mesh.userData.groundAt = (x, y) => Math.min(heightAt(x, y), ceilingAt(x, y, w, h));
  return mesh;
}

export function createWater(w, h, level, color) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * 4, h * 4),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0 }));
  mesh.position.z = level;
  mesh.receiveShadow = true;
  return mesh;
}

// Many copies of one shape. Each item: { x, y, z, s | sx sy sz, rot, color }.
export function instanced(geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, items.length));
  mesh.count = items.length;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z);
    q.setFromEuler(e.set(0, 0, it.rot ?? 0));
    s.set(it.sx ?? it.s, it.sy ?? it.s, it.sz ?? it.s);
    mesh.setMatrixAt(i, m.compose(p, q, s));
    if (it.color !== undefined) mesh.setColorAt(i, c.set(it.color));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Low-poly conifer, about 1.5 tall with its base at z = 0.
export function createPineGeometry() {
  const tiers = [
    new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5).rotateX(Math.PI / 2).translate(0, 0, 0.17),
    new THREE.ConeGeometry(0.5, 0.75, 7).rotateX(Math.PI / 2).translate(0, 0, 0.6),
    new THREE.ConeGeometry(0.38, 0.6, 7).rotateX(Math.PI / 2).translate(0, 0, 0.95),
    new THREE.ConeGeometry(0.24, 0.45, 7).rotateX(Math.PI / 2).translate(0, 0, 1.28),
  ];
  return mergeFlat(tiers);
}

// Box with its base at z = 0.
export const createBlockGeometry = () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5);

// Triangular prism roof along x with its ridge up, base at z = 0.
export const createRoofGeometry = () => new THREE.CylinderGeometry(0.62, 0.62, 1, 3).rotateZ(Math.PI / 2).scale(1, 1.15, 0.8).translate(0, 0, 0.32);
