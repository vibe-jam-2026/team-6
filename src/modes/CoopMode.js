import { GameMode } from './GameMode.js';

export class CoopMode extends GameMode {
  id = 'coop';
  title = 'CO-OP';
  description = 'no friendly fire';
  friendlyFire = false;

  headline(ships, wave) {
    if (ships.length === 1) return super.headline(ships, wave);
    const total = ships.reduce((t, s) => t + s.score, 0);
    return `team score ${total} · wave ${wave}`;
  }
}
