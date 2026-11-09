// Tracks which keys (KeyboardEvent.code) are held, and which were pressed since
// the last simulation step. Physical keys arrive as DOM events; on-screen controls
// (see TouchControls) feed the same codes through press() and release().
export class KeyboardInput {
  #down = new Set();
  #pressed = new Set();
  #captured;
  #keyListeners = [];

  constructor(target = window, capturedCodes = []) {
    this.#captured = new Set(capturedCodes);
    target.addEventListener('keydown', e => {
      if (this.#captured.has(e.code)) e.preventDefault();
      this.press(e.code);
      this.#keyListeners.forEach(fn => fn(e));
    });
    target.addEventListener('keyup', e => this.release(e.code));
    target.addEventListener('blur', () => this.#down.clear());
  }

  press(code) {
    if (!this.#down.has(code)) this.#pressed.add(code);
    this.#down.add(code);
  }

  release(code) { this.#down.delete(code); }

  onKeyDown(fn) { this.#keyListeners.push(fn); }

  isDown(code) { return this.#down.has(code); }

  wasPressed(...codes) { return codes.flat().some(c => this.#pressed.has(c)); }

  endStep() { this.#pressed.clear(); }
}
