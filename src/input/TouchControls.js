import { MENU_KEYS } from '../config.js';
import { lobbyLayout } from '../render/overlay/lobbyLayout.js';

const GAMEOVER_TAP_DELAY = 800; // ms, so a late FIRE tap doesn't skip the results

// On-screen controls for phones and tablets. They don't steer anything
// themselves: every button presses the same key code on KeyboardInput that
// the keyboard would, so the touch pilot simply *is* the given player and
// all game states work unchanged.
//
// The controls turn on by themselves on the first touch (or with ?touch=1 in
// the URL; ?touch=0 keeps them off), so keyboard players never see them.
export class TouchControls {
  enabled = false;
  #root;
  #held = new Map();      // pointerId -> button element under that finger
  #stateName = null;
  #stateSince = 0;

  // players: the PLAYERS config; the pad flies players[0] (P1), while lobby
  // taps on a card join or drop any player.
  constructor({ input, states, players, onGesture = () => {}, doc = document, win = window }) {
    Object.assign(this, { input, states, players, onGesture, win });
    this.#root = this.#build(doc);
    doc.body.appendChild(this.#root);

    const param = new URLSearchParams(win.location.search).get('touch');
    if (param === '1') this.enable();
    if (param !== '0') win.addEventListener('touchstart', () => this.enable(), { passive: true });

    this.#root.addEventListener('pointerdown', e => this.#onDown(e));
    this.#root.addEventListener('pointermove', e => this.#onMove(e));
    for (const type of ['pointerup', 'pointercancel']) {
      this.#root.addEventListener(type, e => this.#onUp(e));
    }
    win.addEventListener('pointerdown', e => this.#onScreenTap(e));
    win.addEventListener('blur', () => this.#releaseAll());
  }

  // true when this device looks touch-first; used to pick lobby defaults
  static likelyTouch(win = window) {
    return win.matchMedia?.('(pointer: coarse)').matches ?? false;
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.#root.classList.add('on');
  }

  // called every frame: show only the buttons that make sense in this state
  sync() {
    const name = this.states.currentName;
    if (name === this.#stateName) return;
    this.#stateName = name;
    this.#stateSince = performance.now();
    this.#root.dataset.state = name;
    this.#releaseAll();
  }

  // --- DOM ---

  #build(doc) {
    const k = this.players[0].keys;
    const root = doc.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div class="pad left">
        <button data-code="${k.left}" data-hold aria-label="turn left">◀</button>
        <button data-code="${k.right}" data-hold aria-label="turn right">▶</button>
      </div>
      <div class="pad right">
        <button data-code="${k.selfDestruct}" class="boom" aria-label="self-destruct">✸</button>
        <button data-code="${k.thrust}" data-hold class="thrust" aria-label="thrust">▲</button>
        <button data-code="${k.fire}" data-hold class="fire" aria-label="fire">●</button>
      </div>
      <div class="menu play">
        <button data-code="${MENU_KEYS.pause[0]}">❚❚</button>
        <button data-code="${MENU_KEYS.mute}">♪</button>
      </div>
      <div class="menu paused">
        <button data-code="${MENU_KEYS.pause[0]}">resume</button>
        <button data-code="${MENU_KEYS.quit}">quit</button>
        <button data-code="${MENU_KEYS.mute}">♪</button>
      </div>`;
    return root;
  }

  #buttonAt(x, y) {
    const el = this.win.document.elementFromPoint(x, y);
    return el?.closest?.('#touch button') ?? null;
  }

  #onDown(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.preventDefault();
    this.onGesture();
    btn.setPointerCapture?.(e.pointerId); // so the matching pointerup always reaches us
    this.#hold(e.pointerId, btn);
  }

  // a finger can slide from one hold button to another (e.g. left to right)
  #onMove(e) {
    const cur = this.#held.get(e.pointerId);
    if (!cur?.hasAttribute('data-hold')) return;
    const btn = this.#buttonAt(e.clientX, e.clientY);
    if (btn !== cur && (!btn || btn.hasAttribute('data-hold'))) this.#hold(e.pointerId, btn);
  }

  #onUp(e) {
    this.onGesture(); // iOS only unlocks audio on touch end
    this.#hold(e.pointerId, null);
  }

  #hold(pointerId, btn) {
    const prev = this.#held.get(pointerId);
    if (prev === btn) return;
    if (btn) this.#held.set(pointerId, btn); else this.#held.delete(pointerId);
    if (prev) this.#setButton(prev, false);
    if (btn) this.#setButton(btn, true);
  }

  #setButton(btn, down) {
    const code = btn.dataset.code;
    const stillHeld = [...this.#held.values()].some(b => b.dataset.code === code);
    btn.classList.toggle('down', [...this.#held.values()].includes(btn));
    if (down) this.input.press(code);
    else if (!stillHeld) this.input.release(code);
  }

  #releaseAll() {
    for (const id of [...this.#held.keys()]) this.#hold(id, null);
  }

  // --- taps on the canvas itself (lobby cards and lines, game over) ---

  #onScreenTap(e) {
    if (!this.enabled || e.target.closest?.('#touch button, a')) return;
    this.onGesture();
    const name = this.states.currentName;
    if (name === 'lobby') this.#lobbyTap(e.clientX, e.clientY);
    else if (name === 'gameover' && performance.now() - this.#stateSince > GAMEOVER_TAP_DELAY) {
      this.#tapKey(MENU_KEYS.start);
    }
  }

  #lobbyTap(x, y) {
    const { innerWidth: W, innerHeight: H } = this.win;
    const layout = lobbyLayout(W, H);
    const card = layout.cards.findIndex(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    if (card >= 0) return this.#tapKey(this.players[card].keys.fire);
    const near = (lineY) => Math.abs(y - lineY) < 18 && Math.abs(x - W / 2) < W * 0.45;
    if (near(layout.modeY)) this.#tapKey(MENU_KEYS.switchMode);
    else if (near(layout.startY)) this.#tapKey(MENU_KEYS.start);
  }

  #tapKey(code) {
    this.input.press(code);
    this.input.release(code);
  }
}
