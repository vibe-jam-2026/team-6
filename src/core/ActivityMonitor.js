// Notices when a person touches the keyboard, mouse or screen, so the game
// can start a demo after a while without any input, and end it on the first one.
export class ActivityMonitor {
  #last = performance.now();
  #fresh = false;

  constructor(target = window) {
    const touched = () => { this.#last = performance.now(); this.#fresh = true; };
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

  // true when there was input since the last step
  get active() { return this.#fresh; }

  // forget old input, as if the player had just touched something
  reset() { this.#last = performance.now(); }

  endStep() { this.#fresh = false; }
}
