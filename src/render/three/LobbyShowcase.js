import { PLAYERS } from '../../config.js';
import { createShipModel } from './views/ShipModel.js';
import { lobbyLayout } from '../overlay/lobbyLayout.js';

const HOVER_HEIGHT = 30;
const DIM_COLOR = 0x333844;

// The swaying 3D ships shown on each player's card in the lobby.
export class LobbyShowcase {
  constructor(scene, cameraRig) {
    this.cameraRig = cameraRig;
    this.models = PLAYERS.map(() => {
      const m = createShipModel('#ffffff');
      m.root.visible = false;
      scene.add(m.root);
      return m;
    });
  }

  update(visible, { t, bounds, session }) {
    const layout = visible ? lobbyLayout(bounds.width, bounds.height) : null;
    this.models.forEach((m, i) => {
      m.root.visible = visible;
      if (!visible) return;
      const card = layout.cards[i], on = session.joined[i];
      m.root.position.copy(this.cameraRig.screenToPlane(card.shipX, card.shipY, HOVER_HEIGHT));
      m.root.scale.setScalar(1.7);
      m.root.rotation.set(0, 0, Math.PI / 2 + Math.sin(t * 0.9 + i) * 0.9);
      m.body.rotation.x = Math.sin(t * 1.6 + i) * 0.5;
      m.flame.visible = on;
      m.flame.scale.set(10 + Math.random() * 8, 1, 1);
      m.shield.visible = false;
      m.hull.material.color.set(on ? PLAYERS[i].color : DIM_COLOR);
      m.hull.material.emissive.set(PLAYERS[i].color);
      m.hull.material.emissiveIntensity = on ? 0.45 : 0.05;
      m.edges.material.color.set(PLAYERS[i].color).multiplyScalar(2.2);
      m.edges.material.opacity = on ? 1 : 0.2;
    });
  }
}
