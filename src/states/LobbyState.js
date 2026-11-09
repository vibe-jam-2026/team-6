import { MENU_KEYS, RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';
import { rand } from '../core/math.js';
import { Asteroid } from '../world/entities/Asteroid.js';

// Players join or leave, pick a mode and start. Rocks drift in the background.
export class LobbyState {
  constructor({ input, bus, world, session, effects, states }) {
    Object.assign(this, { input, bus, world, session, effects, states });
  }

  enter() {
    this.world.ships = [];
    this.world.bullets = [];
    this.world.boss = null;
    this.world.speedScale = 1;
  }

  update(dt) {
    const { input, session, world } = this;
    session.controllers.forEach((c, i) => {
      if (c.togglePressed()) { session.toggleJoined(i); this.#click(); }
    });
    if (input.wasPressed(MENU_KEYS.mouse)) { session.cycleMouseOwner(); this.#click(); }
    if (input.wasPressed(MENU_KEYS.switchMode)) { session.nextMode(); this.#click(); }
    if (input.wasPressed(MENU_KEYS.start) && session.joinedCount > 0) {
      this.#click();
      this.states.change('playing');
      return;
    }
    if (world.asteroids.length < RULES.lobbyDemoRocks) {
      const size = 1 + Math.floor(Math.random() * 3);
      world.asteroids.push(new Asteroid(size, rand(0, world.width), rand(0, world.height)));
    }
    world.updateAsteroids(dt);
    this.effects.update(dt, world);
  }

  #click() { this.bus.emit(EVENTS.MENU_ACTION); }
}
