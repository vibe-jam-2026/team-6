import { RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

// Between waves: the action freezes and every ship still in the game picks
// one of a few upgrades with its own turn and fire keys. When everyone has
// picked, the next wave starts.
export class UpgradeState {
  #lock = 0;
  #finishTimer = null;

  constructor({ bus, world, waves, effects, states, upgrades }) {
    Object.assign(this, { bus, world, waves, effects, states, upgrades });
  }

  enter() {
    this.world.bullets = [];
    for (const s of this.world.ships) s.thrusting = false;
    this.upgrades.start(this.world.ships.filter(s => s.inPlay));
    this.#lock = RULES.upgradeInputLock;
    this.#finishTimer = null;
  }

  update(dt) {
    this.effects.update(dt, this.world);
    this.#lock -= dt;
    if (this.#lock > 0) return;

    if (this.#finishTimer === null) {
      for (const pick of this.upgrades.picks) this.#handle(pick);
      if (this.upgrades.done) this.#finishTimer = 0.45; // let the last choice register on screen
      return;
    }
    this.#finishTimer -= dt;
    if (this.#finishTimer > 0) return;
    this.waves.startNext(this.world);
    this.states.change('playing', { resume: true });
  }

  #handle(pick) {
    const controller = pick.ship.controller;
    if (this.upgrades.move(pick, controller.stepPressed())) this.bus.emit(EVENTS.MENU_ACTION);
    if (controller.confirmPressed() && this.upgrades.confirm(pick)) {
      this.bus.emit(EVENTS.UPGRADE_CHOSEN, { ship: pick.ship, upgrade: pick.chosen });
    }
  }
}
