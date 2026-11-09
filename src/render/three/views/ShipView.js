import { createShipModel } from './ShipModel.js';
import { toSceneX, toSceneY } from '../coords.js';

const SCALE = 1.25;

export class ShipView {
  constructor(ship) {
    this.model = createShipModel(ship.color);
    this.object = this.model.root;
    this.object.scale.setScalar(SCALE);
  }

  update(ship, { t, bounds }) {
    const m = this.model;
    this.object.visible = ship.alive;
    if (!ship.alive) return;
    this.object.position.set(toSceneX(bounds, ship.x), toSceneY(bounds, ship.y), 4 + Math.sin(t * 3 + ship.index) * 2);
    this.object.rotation.set(0, 0, -ship.angle);
    m.body.rotation.x = ship.bank;
    m.flame.visible = ship.thrusting;
    if (ship.thrusting) m.flame.scale.set(14 + Math.random() * 12, 1 + Math.random() * 0.2, 1);
    const shielded = ship.invulnerable > 0;
    const deflector = ship.shieldCharges > 0; // charged deflector upgrade: a calm, steady bubble
    m.shield.visible = shielded || deflector;
    if (m.shield.visible) {
      m.shield.rotation.set(t * 1.3, 0, t * 2);
      m.shield.material.opacity = shielded ? 0.1 + 0.08 * Math.sin(t * 20) : 0.05 + 0.02 * Math.sin(t * 3);
    }
    m.hull.material.emissiveIntensity = shielded && Math.sin(t * 25) > 0 ? 0.75 : 0.35;
  }

  dispose() { this.model.dispose(); }
}
