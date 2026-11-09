// A game mode decides the rules that differ between ways to play.
// Add a mode by subclassing this and registering it in modes/index.js.
export class GameMode {
  id = 'base';
  title = 'MODE';
  description = '';
  friendlyFire = false;

  isOver(ships) { return ships.every(s => s.isOut); }

  // the ship that outlasted the others, if the mode has one
  survivor(ships) { return null; }

  headline(ships, wave) {
    const best = Math.max(0, ...ships.map(s => s.score));
    return `final score ${best} · wave ${wave}`;
  }

  showKills(ships) { return false; }
}
