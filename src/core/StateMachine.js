// Holds the active game state. A state is any object with optional
// enter(params), exit() and update(dt); the machine knows nothing else about it.
export class StateMachine {
  #states = new Map();
  current = null;
  currentName = null;

  register(name, state) {
    this.#states.set(name, state);
    return this;
  }

  change(name, params = {}) {
    const next = this.#states.get(name);
    if (!next) throw new Error(`Unknown state: ${name}`);
    this.current?.exit?.();
    this.current = next;
    this.currentName = name;
    next.enter?.(params);
  }

  update(dt) {
    this.current?.update?.(dt);
  }
}
