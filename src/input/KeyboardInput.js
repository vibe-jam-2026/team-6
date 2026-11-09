// Tracks which physical keys (KeyboardEvent.code) are held, and which were
// pressed since the last simulation step.
export class KeyboardInput {
  #down = new Set();
  #pressed = new Set();
  #captured;
  #keyListeners = [];

  constructor(target = window, capturedCodes = []) {
    this.#captured = new Set(capturedCodes);
    target.addEventListener('keydown', e => {
      if (this.#captured.has(e.code)) e.preventDefault();
      if (!this.#down.has(e.code)) this.#pressed.add(e.code);
      this.#down.add(e.code);
      this.#keyListeners.forEach(fn => fn(e));
    });
    target.addEventListener('keyup', e => this.#down.delete(e.code));
    target.addEventListener('blur', () => this.#down.clear());
  }

  onKeyDown(fn) { this.#keyListeners.push(fn); }

  isDown(code) { return this.#down.has(code); }

  wasPressed(...codes) { return codes.flat().some(c => this.#pressed.has(c)); }

  endStep() { this.#pressed.clear(); }
}
