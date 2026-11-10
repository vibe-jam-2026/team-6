import { DEFAULT_JOINED, PLAYERS, sceneryForWave } from '../config.js';
import { EVENTS } from '../core/EventBus.js';
import { GAME_MODES } from '../modes/index.js';
import { Ship } from '../world/entities/Ship.js';

// What the players chose in the lobby and what the HUD should announce:
// who has joined, which mode, the wave banner and the final result.
export class Session {
  joined = [...DEFAULT_JOINED];
  #modeIndex = 0;
  banner = { text: '', timeLeft: 0 };
  result = null;
  detonatedBy = null; // the ship that self-destructed and ended the match, if any
  victory = false;    // the final boss is down: the celebration is on
  invincible = false; // testing aid: ships cannot be destroyed
  mouseOwner = null;  // index of the player flying with the mouse, or null
  computer = [];      // computer[i]: player i is flown by the computer
  demo = false;       // demo mode: the computer flies every jet
  #beforeDemo = null; // the lobby setup to put back when the demo ends
  scoreEntry = null;  // { ship, initials } while a pilot types initials for the high-score table
  newHighScores = []; // entries added on this results screen, to highlight them

  // controllers: one human controller per player; computers: one computer pilot per player
  constructor(bus, controllers, modes = GAME_MODES, computers = []) {
    this.controllers = controllers;
    this.computers = computers;
    this.modes = modes;
    bus.on(EVENTS.WAVE_STARTED, ({ wave, boss, final }) => {
      const place = sceneryForWave(wave).title.toUpperCase();
      const what = final ? 'FINAL BOSS' : boss ? 'BOSS' : null;
      this.announce(what ? `WAVE ${wave} · ${what} · ${place}` : `WAVE ${wave}  ·  ${place}`, boss ? 3 : 2);
    });
    bus.on(EVENTS.SELF_DESTRUCT, ({ ship }) => { this.detonatedBy = ship; });
    bus.on(EVENTS.BOSS_DESTROYED, () => this.announce('BOSS DESTROYED', 3));
    bus.on(EVENTS.VICTORY, () => { this.victory = true; this.announce('VICTORY!', 5); });
  }

  get mode() { return this.modes[this.#modeIndex]; }
  get joinedCount() { return this.joined.filter(Boolean).length; }
  get humanCount() { return this.joined.filter((on, i) => on && !this.computer[i]).length; }

  // a human joining or leaving also takes the seat back from the computer
  toggleJoined(i) {
    this.joined[i] = this.computer[i] ? true : !this.joined[i];
    this.computer[i] = false;
  }

  // hand player i to the computer (joining them), or take them back out
  toggleComputer(i) {
    if (!this.computers[i]) return;
    this.computer[i] = !this.computer[i];
    this.joined[i] = this.computer[i];
  }
  // demo mode: every jet joins and is flown by the computer; endDemo puts the
  // lobby back the way the players left it
  startDemo() {
    if (!this.demo) this.#beforeDemo = { joined: [...this.joined], computer: [...this.computer] };
    this.demo = true;
    PLAYERS.forEach((_, i) => {
      this.joined[i] = Boolean(this.computers[i]);
      this.computer[i] = Boolean(this.computers[i]);
    });
  }

  endDemo() {
    if (!this.demo) return;
    this.demo = false;
    this.joined = this.#beforeDemo.joined;
    this.computer = this.#beforeDemo.computer;
    this.#beforeDemo = null;
  }

  toggleInvincible() { this.invincible = !this.invincible; }
  // nobody -> P1 -> P2 -> ... -> nobody
  cycleMouseOwner() {
    const next = this.mouseOwner === null ? 0 : this.mouseOwner + 1;
    this.mouseOwner = next < PLAYERS.length ? next : null;
  }

  nextMode() { this.#modeIndex = (this.#modeIndex + 1) % this.modes.length; }

  createShips() {
    this.detonatedBy = null;
    this.victory = false;
    const solo = this.humanCount === 1;
    this.controllers.forEach((c, i) => {
      c.solo = solo;               // a lone pilot can also fire with Space
      c.useMouse = i === this.mouseOwner;
    });
    return PLAYERS
      .map((player, i) => this.joined[i] ? new Ship(i, player, this.computer[i] ? this.computers[i] : this.controllers[i]) : null)
      .filter(Boolean);
  }

  announce(text, seconds = 2) { this.banner = { text, timeLeft: seconds }; }
  tickBanner(dt) { this.banner.timeLeft -= dt; }

  // won: the final boss went down (a self-destruct that takes it out doesn't count)
  finish(ships, wave, { won = false } = {}) {
    const mode = this.mode;
    const ranked = [...ships].sort((a, b) => b.score - a.score);
    won = won && !this.detonatedBy;
    let headline = mode.headline(ships, wave);
    if (this.detonatedBy) headline = `${this.detonatedBy.name} blew everything up · wave ${wave}`;
    else if (won) headline = ships.length > 1 ? `the Mothership is down · ${ranked[0].name} tops the score` : `the Mothership is down · final score ${ranked[0].score}`;
    this.result = {
      won,
      wave,
      ranked,
      headline,
      showKills: mode.showKills(ships),
      multiplayer: ships.length > 1,
    };
  }
}
