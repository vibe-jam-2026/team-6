import { MENU_KEYS, SCENERY, FLYOVER, WAVES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// The victory lap after the Mothership falls: the camera tours every
// landscape of the campaign while the surviving jets fly a figure-eight in
// formation and the credits roll. Then the results. Enter (or a tap) skips.
// The renderer shows session.flyover.key instead of the wave's landscape.
export class FlyoverState {
  #t = 0;

  constructor({ input, bus, world, session, effects, states }) {
    Object.assign(this, { input, bus, world, session, effects, states });
  }

  enter() {
    this.#t = 0;
    this.world.clearField();
    // everyone who made it to the end flies the lap, even pilots who were out
    this.world.ships.forEach(s => { s.alive = true; s.invulnerable = 0; s.rollTime = 0; s.shieldCharges = 0; });
    this.#setStop(0);
  }

  exit() { this.session.flyover = null; }

  update(dt) {
    if (this.input.wasPressed(MENU_KEYS.start, MENU_KEYS.exitDemo)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('gameover');
      return;
    }
    this.#t += dt;
    const stop = Math.floor(this.#t / FLYOVER.perLandscape);
    if (stop >= Math.min(WAVES.final, SCENERY.length)) {
      this.states.change('gameover');
      return;
    }
    if (stop !== this.session.flyover.index) this.#setStop(stop);
    this.session.flyover.t = this.#t - stop * FLYOVER.perLandscape;
    this.#flyFormation(dt);
    this.effects.update(dt, this.world);
  }

  #setStop(index) {
    const { key, title } = SCENERY[index];
    this.session.flyover = { index, key, title, t: 0, count: Math.min(WAVES.final, SCENERY.length) };
  }

  // a slow figure-eight around the arena, wingmen off the leader's wing
  #flyFormation(dt) {
    const { width: w, height: h } = this.world, t = this.#t * 0.45;
    const path = s => ({ x: w / 2 + Math.sin(s) * w * 0.3, y: h / 2 + Math.sin(s * 2) * h * 0.18 });
    this.world.ships.forEach((ship, i) => {
      const lag = i * 0.16, p = path(t - lag), ahead = path(t - lag + 0.02);
      const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x);
      const side = (i % 2 ? 1 : -1) * Math.min(i, 1) * 34; // wingman a little to the side
      ship.x = p.x - Math.sin(angle) * side;
      ship.y = p.y + Math.cos(angle) * side;
      const turn = ((angle - ship.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ship.bank += (Math.max(-1, Math.min(1, turn * 20)) * 0.6 - ship.bank) * Math.min(1, dt * 4);
      ship.angle = angle;
      ship.vx = (ahead.x - p.x) * 20; ship.vy = (ahead.y - p.y) * 20;
      ship.thrusting = true;
    });
  }
}
