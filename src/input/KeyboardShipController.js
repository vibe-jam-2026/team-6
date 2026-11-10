// Turns one player's keys into an abstract control intent. Ships only depend on
// the { thrust, turn, fire, toggleFire } shape, so another controller (gamepad, AI, network)
// can be swapped in without touching Ship.
//
// The fire key toggles auto fire on and off rather than being held.
// soloFire is an extra fire key (Space) that only counts while `solo` is set,
// i.e. when this player flies alone and no one else needs the key.
export class KeyboardShipController {
  solo = false;

  constructor(input, keys, soloFire = 'Space') {
    this.input = input;
    this.keys = keys;
    this.soloFire = soloFire;
  }

  read() {
    const { input, keys } = this;
    return {
      thrust: input.isDown(keys.thrust),
      turn: (input.isDown(keys.right) ? 1 : 0) - (input.isDown(keys.left) ? 1 : 0),
      fire: false,
      toggleFire: this.confirmPressed(),
    };
  }

  // menu navigation for the upgrade picker: -1 / 0 / 1 from the turn keys
  stepPressed() {
    const { input, keys } = this;
    return (input.wasPressed(keys.right) ? 1 : 0) - (input.wasPressed(keys.left) ? 1 : 0);
  }

  // 1 when the weapon key was pressed this step: cycle to the next weapon
  weaponStep() {
    return this.input.wasPressed(this.keys.weapon) ? 1 : 0;
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
