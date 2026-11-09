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
  invincible = false; // testing aid: ships cannot be destroyed
  mouseOwner = null;  // index of the player flying with the mouse, or null
  computer = [];      // computer[i]: player i is flown by the computer

  // controllers: one human controller per player; computers: one computer pilot per player
  constructor(bus, controllers, modes = GAME_MODES, computers = []) {
    this.controllers = controllers;
    this.computers = computers;
    this.modes = modes;
    bus.on(EVENTS.WAVE_STARTED, ({ wave, boss }) => {
      const place = sceneryForWave(wave).title.toUpperCase();
      this.announce(boss ? `WAVE ${wave} · BOSS · ${place}` : `WAVE ${wave}  ·  ${place}`, boss ? 3 : 2);
    });
    bus.on(EVENTS.SELF_DESTRUCT, ({ ship }) => { this.detonatedBy = ship; });
    bus.on(EVENTS.BOSS_DESTROYED, () => this.announce('BOSS DESTROYED', 3));
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
  toggleInvincible() { this.invincible = !this.invincible; }
  // nobody -> P1 -> P2 -> ... -> nobody
  cycleMouseOwner() {
    const next = this.mouseOwner === null ? 0 : this.mouseOwner + 1;
    this.mouseOwner = next < PLAYERS.length ? next : null;
  }

  nextMode() { this.#modeIndex = (this.#modeIndex + 1) % this.modes.length; }

  createShips() {
    this.detonatedBy = null;
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

  finish(ships, wave) {
    const mode = this.mode;
    this.result = {
      ranked: [...ships].sort((a, b) => b.score - a.score),
      headline: this.detonatedBy
        ? `${this.detonatedBy.name} blew everything up · wave ${wave}`
        : mode.headline(ships, wave),
      showKills: mode.showKills(ships),
      multiplayer: ships.length > 1,
    };
  }
}
