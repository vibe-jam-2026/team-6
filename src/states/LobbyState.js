import { MENU_KEYS, RULES, COMPUTER_PLAYER, DEMO } from '../config.js';
import { EVENTS } from '../core/EventBus.js';
import { rand } from '../core/math.js';
import { Asteroid } from '../world/entities/Asteroid.js';

// Players join or leave, pick a mode and start. Rocks drift in the background.
// Left alone for a while (or on the demo key) it starts a computer-only demo.
export class LobbyState {
  constructor({ input, bus, world, session, effects, states, activity }) {
    Object.assign(this, { input, bus, world, session, effects, states, activity });
  }

  enter() {
    this.session.endDemo();
    this.activity?.reset(); // the idle clock starts over each time the lobby opens
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
    if (input.wasPressed(MENU_KEYS.computer)) { session.toggleComputer(COMPUTER_PLAYER); this.#click(); }
    if (input.wasPressed(MENU_KEYS.switchMode)) { session.nextMode(); this.#click(); }
    if (input.wasPressed(MENU_KEYS.cpuSkill)) { session.nextCpuSkill(); this.#click(); }
    const idle = this.activity && this.activity.idleSeconds >= DEMO.idleTime;
    if (input.wasPressed(MENU_KEYS.demo) || idle) {
      this.#click();
      session.startDemo();
      this.states.change('playing');
      return;
    }
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
