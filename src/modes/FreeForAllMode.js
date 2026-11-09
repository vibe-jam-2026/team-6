import { GameMode } from './GameMode.js';

export class FreeForAllMode extends GameMode {
  id = 'ffa';
  title = 'FREE-FOR-ALL';
  description = 'shoot each other';
  friendlyFire = true;

  isOver(ships) {
    const inPlay = ships.filter(s => s.inPlay).length;
    return ships.length > 1 ? inPlay <= 1 : inPlay === 0;
  }

  survivor(ships) {
    return ships.length > 1 ? ships.find(s => s.inPlay) || null : null;
  }

  headline(ships, wave) {
    if (ships.length === 1) return super.headline(ships, wave);
    const last = this.survivor(ships);
    return last ? `${last.name} is the last ship flying` : 'nobody survived';
  }

  showKills(ships) { return ships.length > 1; }
}
