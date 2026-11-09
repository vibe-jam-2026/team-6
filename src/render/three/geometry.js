import * as THREE from 'three';

// Small helpers for building low-poly models. Model space: nose along +x,
// wings span ±y, +z is up (towards the camera).

// Merges geometries into one flat-shaded, non-indexed position-only geometry.
export function mergeFlat(geometries) {
  const parts = geometries.map(g => (g.index ? g.toNonIndexed() : g).getAttribute('position').array);
  const merged = new THREE.BufferGeometry();
  const positions = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { positions.set(p, offset); offset += p.length; }
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
}

// A flat plate in the xy plane from a polygon outline, `thickness` deep, centred on z = 0.
export const plate = (points, thickness) => new THREE.ExtrudeGeometry(
  new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))), { depth: thickness, bevelEnabled: false },
).translate(0, 0, -thickness / 2);

// Turns a cylinder/cone so it lies along +x (its "top" ends up at +x).
export const alongX = g => g.rotateZ(-Math.PI / 2);
