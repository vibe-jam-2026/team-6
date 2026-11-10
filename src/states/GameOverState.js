import { MENU_KEYS, DEMO, RULES } from '../config.js';
import { EVENTS } from '../core/EventBus.js';

const LETTERS = Array.from({ length: 26 }, (_, i) => `Key${String.fromCharCode(65 + i)}`);
const INITIALS = 3;

// The results screen. Human pilots whose score makes the high-score table
// type their initials first (letters, Backspace, Enter); Enter alone keeps
// their player name. After that Enter goes back to the lobby.
export class GameOverState {
  #demoTimer = 0;
  #queue = [];   // ships still to enter initials
  #lock = 0;     // ignore keys for a moment so letters held from flying don't count

  constructor({ input, bus, world, effects, states, session, highScores }) {
    Object.assign(this, { input, bus, world, effects, states, session, highScores });
  }

  enter() {
    this.#demoTimer = DEMO.resultsTime;
    this.#lock = RULES.shopInputLock;
    const s = this.session;
    s.newHighScores = [];
    // demo matches, computer pilots and invincible test runs don't count
    const counts = !s.demo && !s.invincible && this.highScores && s.result;
    this.#queue = counts ? s.result.ranked.filter(ship => !ship.controller.isComputer && this.highScores.qualifies(ship.score)) : [];
    this.#next();
  }

  update(dt) {
    // a demo shows the results for a moment, then flies the next match
    if (this.session?.demo) {
      if ((this.#demoTimer -= dt) <= 0) {
        this.states.change('playing');
        return;
      }
    } else if ((this.#lock -= dt) > 0) {
      // waiting out the input lock
    } else if (this.session.scoreEntry) {
      this.#typeInitials();
    } else if (this.input.wasPressed(MENU_KEYS.start)) {
      this.bus.emit(EVENTS.MENU_ACTION);
      this.states.change('lobby');
      return;
    }
    this.world.updateAsteroids(dt);
    this.effects.update(dt, this.world);
  }

  #typeInitials() {
    const { input } = this, entry = this.session.scoreEntry;
    for (const code of LETTERS) {
      if (input.wasPressed(code) && entry.initials.length < INITIALS) {
        entry.initials += code.slice(3);
        this.bus.emit(EVENTS.MENU_ACTION);
      }
    }
    if (input.wasPressed('Backspace') && entry.initials) entry.initials = entry.initials.slice(0, -1);
    if (input.wasPressed(MENU_KEYS.start)) {
      const { ship } = entry, result = this.session.result;
      const saved = this.highScores.add({
        initials: entry.initials || ship.player.name, score: ship.score, wave: result.wave,
        won: result.won, mode: this.session.mode.title, color: ship.color,
      });
      if (saved) this.session.newHighScores.push(saved);
      this.bus.emit(EVENTS.MENU_ACTION);
      this.#lock = 0.15; // so the same Enter doesn't also leave the screen
      this.#next();
    }
  }

  // the next pilot still on the table (an earlier entry may have pushed them off)
  #next() {
    while (this.#queue.length && !this.highScores.qualifies(this.#queue[0].score)) this.#queue.shift();
    const ship = this.#queue.shift();
    this.session.scoreEntry = ship ? { ship, initials: '' } : null;
  }
}
