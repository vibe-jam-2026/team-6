// Turns one player's keys into an abstract control intent. Ships only depend on
// the { thrust, turn, fire } shape, so another controller (gamepad, AI, network)
// can be swapped in without touching Ship.
export class KeyboardShipController {
  constructor(input, keys) {
    this.input = input;
    this.keys = keys;
  }

  read() {
    const { input, keys } = this;
    return {
      thrust: input.isDown(keys.thrust),
      turn: (input.isDown(keys.right) ? 1 : 0) - (input.isDown(keys.left) ? 1 : 0),
      fire: input.isDown(keys.fire),
    };
  }

  // menu navigation for the upgrade picker: -1 / 0 / 1 from the turn keys
  stepPressed() {
    const { input, keys } = this;
    return (input.wasPressed(keys.right) ? 1 : 0) - (input.wasPressed(keys.left) ? 1 : 0);
  }

  // used by the lobby to join or leave, and to confirm an upgrade
  togglePressed() {
    return this.input.wasPressed(this.keys.fire);
  }
}
