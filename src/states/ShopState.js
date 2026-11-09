import { RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';
import { READY } from '../upgrades/Shop.js';

const COMPUTER_THINK = 0.6; // seconds a computer pilot spends on each purchase

// Between waves: the action freezes and every ship still in the game shops
// with its own turn keys (browse) and fire key (buy / ready). Computer pilots
// shop on their own. When everyone is ready, the next wave starts.
export class ShopState {
  #lock = 0;
  #finishTimer = null;
  #think = new Map(); // shop entry -> seconds until the computer's next purchase

  constructor({ bus, world, waves, effects, states, shop }) {
    Object.assign(this, { bus, world, waves, effects, states, shop });
  }

  enter() {
    this.world.bullets = [];
    for (const s of this.world.ships) s.thrusting = false;
    this.shop.start(this.world.ships.filter(s => s.inPlay));
    this.#lock = RULES.shopInputLock;
    this.#finishTimer = null;
    this.#think.clear();
  }

  update(dt) {
    this.effects.update(dt, this.world);
    this.shop.tick(dt);
    this.#lock -= dt;
    if (this.#lock > 0) return;

    if (this.#finishTimer === null) {
      for (const entry of this.shop.entries) {
        if (entry.ship.controller.pickPurchase) this.#computerShops(entry, dt);
        else this.#handle(entry);
      }
      if (this.shop.done) this.#finishTimer = 0.45; // let the last choice register on screen
      return;
    }
    this.#finishTimer -= dt;
    if (this.#finishTimer > 0) return;
    this.waves.startNext(this.world);
    this.states.change('playing', { resume: true });
  }

  #handle(entry) {
    const controller = entry.ship.controller;
    if (this.shop.move(entry, controller.stepPressed())) this.bus.emit(EVENTS.MENU_ACTION);
    if (controller.confirmPressed()) this.#announce(entry, this.shop.confirm(entry));
  }

  // one purchase every so often, chosen by the computer, then ready
  #computerShops(entry, dt) {
    if (entry.ready) return;
    const left = (this.#think.get(entry) ?? COMPUTER_THINK) - dt;
    this.#think.set(entry, left);
    if (left > 0) return;
    this.#think.set(entry, COMPUTER_THINK);
    const pick = entry.ship.controller.pickPurchase(this.shop.affordable(entry.ship));
    this.shop.pointAt(entry, pick ?? READY);
    this.#announce(entry, this.shop.confirm(entry));
  }

  #announce(entry, result) {
    const ship = entry.ship;
    if (result.bought) this.bus.emit(EVENTS.UPGRADE_BOUGHT, { ship, upgrade: result.bought, price: result.price });
    else if (result.denied) this.bus.emit(EVENTS.PURCHASE_DENIED, { ship, reason: result.denied });
    else this.bus.emit(EVENTS.MENU_ACTION);
  }
}
