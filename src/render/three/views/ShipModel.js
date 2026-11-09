import * as THREE from 'three';

// Shared geometry for every ship: a low-poly arrowhead fighter.
const hullGeometry = (() => {
  const N = [19, 0, 1], L = [-12, -12, -1], R = [-12, 12, -1], B = [-7, 0, 0], T = [-5, 0, 8], D = [-5, 0, -4];
  const tris = [N, L, T, N, T, R, L, B, T, T, B, R, N, D, L, N, R, D, L, D, B, B, D, R];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
})();
const edgeGeometry = new THREE.EdgesGeometry(hullGeometry, 1);
const flameGeometry = new THREE.ConeGeometry(4.5, 1, 10).rotateZ(Math.PI / 2).translate(-0.5, 0, 0);
const shieldGeometry = new THREE.IcosahedronGeometry(25, 2);

// Builds one ship model in the given colour. `body` is nested inside `root`
// so it can bank independently of the heading.
export function createShipModel(colorHex) {
  const color = new THREE.Color(colorHex);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const hull = new THREE.Mesh(hullGeometry, new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.35, metalness: 0.45, roughness: 0.35, flatShading: true, side: THREE.DoubleSide,
  }));
  hull.castShadow = true;
  const edges = new THREE.LineSegments(edgeGeometry,
    new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true }));
  const flame = new THREE.Mesh(flameGeometry, new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffa040).multiplyScalar(2.5), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flame.position.set(-7, 0, 0.5);
  const shield = new THREE.Mesh(shieldGeometry, new THREE.MeshBasicMaterial({
    color: color.clone().multiplyScalar(0.7), wireframe: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  body.add(hull, edges, flame);
  root.add(shield);
  const dispose = () => [hull, edges, flame, shield].forEach(m => m.material.dispose());
  return { root, body, hull, edges, flame, shield, dispose };
}
