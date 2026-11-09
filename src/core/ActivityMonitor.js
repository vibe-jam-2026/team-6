// Notices when a person touches the keyboard, mouse or screen, so the game
// can start a demo after a while without any input.
export class ActivityMonitor {
  #last = performance.now();

  constructor(target = window) {
    const touched = () => { this.#last = performance.now(); };
    for (const type of ['pointerdown', 'wheel', 'touchstart']) {
      target.addEventListener(type, touched, { passive: true });
    }
    // a held key repeats keydown; only a fresh press counts
    target.addEventListener('keydown', e => { if (!e.repeat) touched(); });
    // a mouse that moves counts too (but not the stray events of a resting pointer)
    target.addEventListener('pointermove', e => {
      if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) touched();
    }, { passive: true });
  }

  // seconds since the last input
  get idleSeconds() { return (performance.now() - this.#last) / 1000; }

  // forget old input, as if the player had just touched something
  reset() { this.#last = performance.now(); }
}
