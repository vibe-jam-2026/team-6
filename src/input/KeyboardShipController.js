import { ROLL } from '../config.js';

// Turns one player's keys into an abstract control intent. Ships only depend on
// the { thrust, turn, fire, toggleFire } shape, so another controller (gamepad, AI, network)
// can be swapped in without touching Ship.
//
// The fire key toggles auto fire on and off rather than being held.
// soloFire is an extra fire key (Space) that only counts while `solo` is set,
// i.e. when this player flies alone and no one else needs the key.
export class KeyboardShipController {
  solo = false;
  #frame = 0;
  #lastTap = { left: -Infinity, right: -Infinity }; // frame of the last turn-key tap

  constructor(input, keys, soloFire = 'Space') {
    this.input = input;
    this.keys = keys;
    this.soloFire = soloFire;
  }

  read() {
    const { input, keys } = this;
    this.#frame++;
    return {
      thrust: input.isDown(keys.thrust),
      turn: (input.isDown(keys.right) ? 1 : 0) - (input.isDown(keys.left) ? 1 : 0),
      fire: false,
      toggleFire: this.confirmPressed(),
      roll: this.#doubleTap('right') - this.#doubleTap('left'),
    };
  }

  // 1 when a turn key is tapped twice in quick succession: a barrel roll that way
  #doubleTap(side) {
    if (!this.input.wasPressed(this.keys[side])) return 0;
    const quick = this.#frame - this.#lastTap[side] <= ROLL.doubleTap;
    this.#lastTap[side] = quick ? -Infinity : this.#frame;
    return quick ? 1 : 0;
  }

  // menu navigation for the upgrade picker: -1 / 0 / 1 from the turn keys
  stepPressed() {
    const { input, keys } = this;
    return (input.wasPressed(keys.right) ? 1 : 0) - (input.wasPressed(keys.left) ? 1 : 0);
  }

  selfDestructPressed() {
    return this.input.wasPressed(this.keys.selfDestruct);
  }

  // used by the lobby to join or leave
  togglePressed() {
    return this.input.wasPressed(this.keys.fire);
  }

  // takes the highlighted upgrade between waves
  confirmPressed() {
    return this.togglePressed() || (this.solo && this.input.wasPressed(this.soloFire));
  }
}
