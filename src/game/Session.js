import { DEFAULT_JOINED, PLAYERS } from '../config.js';
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

  constructor(bus, controllers, modes = GAME_MODES) {
    this.controllers = controllers;
    this.modes = modes;
    bus.on(EVENTS.WAVE_STARTED, ({ wave }) => this.announce(`WAVE ${wave}`));
  }

  get mode() { return this.modes[this.#modeIndex]; }
  get joinedCount() { return this.joined.filter(Boolean).length; }

  toggleJoined(i) { this.joined[i] = !this.joined[i]; }
  nextMode() { this.#modeIndex = (this.#modeIndex + 1) % this.modes.length; }

  createShips() {
    return PLAYERS
      .map((player, i) => this.joined[i] ? new Ship(i, player, this.controllers[i]) : null)
      .filter(Boolean);
  }

  announce(text, seconds = 2) { this.banner = { text, timeLeft: seconds }; }
  tickBanner(dt) { this.banner.timeLeft -= dt; }

  finish(ships, wave) {
    const mode = this.mode;
    this.result = {
      ranked: [...ships].sort((a, b) => b.score - a.score),
      headline: mode.headline(ships, wave),
      showKills: mode.showKills(ships),
      multiplayer: ships.length > 1,
    };
  }
}
