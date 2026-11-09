// Tracks the mouse: where the pointer is on screen, which buttons are held,
// which were pressed since the last simulation step, and wheel steps.
// Only real mice count (pen and touch pointers are left to TouchControls).
export const MOUSE = { left: 0, middle: 1, right: 2 };

export class MouseInput {
  x = 0;
  y = 0;
  moved = false;     // true once the pointer has been seen over the page
  #down = new Set();
  #pressed = new Set();
  #wheel = 0;
  #listeners = [];

  constructor(target = window) {
    const isMouse = e => !e.pointerType || e.pointerType === 'mouse';
    target.addEventListener('pointermove', e => {
      if (!isMouse(e)) return;
      this.x = e.clientX; this.y = e.clientY; this.moved = true;
    });
    target.addEventListener('pointerdown', e => {
      if (!isMouse(e)) return;
      this.x = e.clientX; this.y = e.clientY; this.moved = true;
      if (!this.#down.has(e.button)) this.#pressed.add(e.button);
      this.#down.add(e.button);
      this.#listeners.forEach(fn => fn(e));
    });
    target.addEventListener('pointerup', e => { if (isMouse(e)) this.#down.delete(e.button); });
    target.addEventListener('wheel', e => { this.#wheel += Math.sign(e.deltaY); }, { passive: true });
    target.addEventListener('blur', () => this.#down.clear());
    // the right button thrusts, so keep the browser menu away
    target.addEventListener('contextmenu', e => e.preventDefault());
  }

  onButtonDown(fn) { this.#listeners.push(fn); }

  isDown(button) { return this.#down.has(button); }
  wasPressed(button) { return this.#pressed.has(button); }

  // -1 / 0 / 1: wheel movement since the last step
  wheelStep() { return Math.sign(this.#wheel); }

  endStep() {
    this.#pressed.clear();
    this.#wheel = 0;
  }
}
