import * as THREE from 'three';

// Model space: nose points +x, wings span ±y, +z is up (towards the camera).

// Merges geometries into one flat-shaded, non-indexed position-only geometry.
function mergeFlat(geometries) {
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
const plate = (points, thickness) => new THREE.ExtrudeGeometry(
  new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))), { depth: thickness, bevelEnabled: false },
).translate(0, 0, -thickness / 2);

// Cylinder/cone along +x (its "top" ends up pointing at the nose).
const alongX = g => g.rotateZ(-Math.PI / 2);

// Shared geometry for every ship: a low-poly Saab JAS 39 Gripen E —
// close-coupled canard delta with a single fin and a single engine.
const hullGeometry = (() => {
  const fuselage = alongX(new THREE.CylinderGeometry(2.3, 2.6, 25, 10)).scale(1, 1, 0.85).translate(-1.5, 0, 0);
  const nose = alongX(new THREE.ConeGeometry(2.3, 9, 10)).scale(1, 1, 0.85).translate(15.5, 0, 0);
  const nozzle = alongX(new THREE.CylinderGeometry(2.6, 2.0, 2.5, 10)).translate(-15.2, 0, 0);
  const spine = new THREE.BoxGeometry(14, 1.6, 1.6).translate(-4, 0, 2);
  const intakes = [-1, 1].map(s => new THREE.BoxGeometry(7, 1.8, 2.4).translate(4, s * 2.6, -0.3));
  const wing = plate([[6, 2], [-10.5, 11], [-13.5, 11], [-13.5, -11], [-10.5, -11], [6, -2]], 0.7).translate(0, 0, -0.6);
  const canards = plate([[7, 2], [2.5, 7], [0.8, 7], [1.2, 2], [1.2, -2], [0.8, -7], [2.5, -7], [7, -2]], 0.4).translate(0, 0, 0.6);
  const fin = plate([[-3, 0], [-11, 9.5], [-14, 9.5], [-14.5, 0]], 0.7).rotateX(Math.PI / 2).translate(0, 0, 1.5);
  const wingtipMissiles = [-1, 1].map(s => alongX(new THREE.CylinderGeometry(0.35, 0.45, 7, 6)).translate(-10.5, s * 11.4, -0.6));
  return mergeFlat([fuselage, nose, nozzle, spine, ...intakes, wing, canards, fin, ...wingtipMissiles]).scale(0.85, 0.85, 0.85);
})();
const edgeGeometry = new THREE.EdgesGeometry(hullGeometry, 35);
const canopyGeometry = new THREE.SphereGeometry(1, 12, 8).scale(4.2, 1.35, 1.4).translate(8.3, 0, 1.6);
const flameGeometry = new THREE.ConeGeometry(1.9, 1, 10).rotateZ(Math.PI / 2).translate(-0.5, 0, 0);
const shieldGeometry = new THREE.IcosahedronGeometry(25, 2);
const canopyMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a2a3a, emissive: 0x3a6a9a, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.1,
});

// Builds one ship model in the given colour. `body` is nested inside `root`
// so it can bank independently of the heading.
export function createShipModel(colorHex) {
  const color = new THREE.Color(colorHex);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const hull = new THREE.Mesh(hullGeometry, new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.35, metalness: 0.55, roughness: 0.35, flatShading: true, side: THREE.DoubleSide,
  }));
  hull.castShadow = true;
  const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
  const edges = new THREE.LineSegments(edgeGeometry,
    new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true }));
  const flame = new THREE.Mesh(flameGeometry, new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffa040).multiplyScalar(2.5), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flame.position.set(-14.2, 0, 0);
  const shield = new THREE.Mesh(shieldGeometry, new THREE.MeshBasicMaterial({
    color: color.clone().multiplyScalar(0.7), wireframe: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  body.add(hull, canopy, edges, flame);
  root.add(shield);
  const dispose = () => [hull, edges, flame, shield].forEach(m => m.material.dispose());
  return { root, body, hull, edges, flame, shield, dispose };
}
