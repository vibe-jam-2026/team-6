import { MENU_KEYS, COMPUTER_PLAYER } from '../config.js';
import { lobbyLayout, lobbyTargets, hit } from '../render/overlay/lobbyLayout.js';

// Makes the lobby screen clickable (mouse) and tappable (touch). Every card and
// button stands for a hotkey, so a click simply presses that key on
// KeyboardInput and the lobby reacts exactly as if it had been typed.
// It also tracks which button the mouse is over, for the hover highlight.
export class LobbyPointer {
  hover = null;   // the target under the mouse pointer, or null

  // isTouch(): true while the touch controls are on (the lobby lays out for touch then)
  constructor({ input, states, isTouch = () => false, win = window }) {
    Object.assign(this, { input, states, isTouch, win });
    win.addEventListener('pointerdown', e => this.#onDown(e));
    win.addEventListener('pointermove', e => this.#onMove(e));
  }

  get #active() { return this.states.currentName === 'lobby'; }

  #targetAt(x, y) {
    const tap = this.isTouch();
    const layout = lobbyLayout(this.win.innerWidth, this.win.innerHeight, { tap });
    const target = lobbyTargets(layout).find(r => hit(r, x, y));
    if (!target) return null;
    // the touch pad flies P1 only, so on touch P2's card hands that jet to the computer
    if (tap && target === layout.cards[COMPUTER_PLAYER]) return { ...target, key: MENU_KEYS.computer };
    return target;
  }

  #onDown(e) {
    if (!this.#active || e.button > 0 || e.target.closest?.('#touch button, a')) return;
    const target = this.#targetAt(e.clientX, e.clientY);
    if (!target) return;
    this.input.press(target.key);
    this.input.release(target.key);
  }

  #onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    this.hover = this.#active ? this.#targetAt(e.clientX, e.clientY) : null;
    this.win.document.body.style.cursor = this.hover ? 'pointer' : '';
  }

  // clears the highlight and cursor when the lobby closes
  sync() {
    if (this.#active || !this.hover) return;
    this.hover = null;
    this.win.document.body.style.cursor = '';
  }
}
