// One player's controls: always their keys, plus the mouse when the lobby
// gave it to them. The Session flips `useMouse` and `solo` as a match starts.
export class PlayerController {
  constructor(keyboard, mouse) {
    this.keyboard = keyboard;
    this.mouse = mouse;
    this.useMouse = false;
    this.autoThrust = false;   // voice "engage" holds the thrusters on until "stop"
  }

  get solo() { return this.keyboard.solo; }
  set solo(on) { this.keyboard.solo = on; }

  read(ship) {
    const k = this.keyboard.read(ship);
    const c = this.useMouse ? this.#merge(k, this.mouse.read(ship)) : k;
    return this.autoThrust ? { ...c, thrust: true } : c;
  }

  #merge(k, m) {
    return { thrust: k.thrust || m.thrust, turn: k.turn || m.turn, fire: k.fire || m.fire, toggleFire: k.toggleFire || m.toggleFire };
  }

  stepPressed() {
    return this.keyboard.stepPressed() || (this.useMouse ? this.mouse.stepPressed() : 0);
  }

  weaponStep() {
    return this.keyboard.weaponStep() || (this.useMouse ? this.mouse.weaponStep() : 0);
  }

  selfDestructPressed() {
    return this.keyboard.selfDestructPressed() || (this.useMouse && this.mouse.selfDestructPressed());
  }

  // lobby join / leave stays on the keyboard, so a stray click can't drop a pilot
  togglePressed() { return this.keyboard.togglePressed(); }

  confirmPressed() {
    return this.keyboard.confirmPressed() || (this.useMouse && this.mouse.confirmPressed());
  }
}
