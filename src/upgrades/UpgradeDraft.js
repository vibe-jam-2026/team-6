import { RULES } from '../config.js';
import { UPGRADES } from './catalog.js';

// The choice offered between waves: every ship still in the game is dealt a
// few different upgrades and keeps exactly one. Pure game logic, no input.
export class UpgradeDraft {
  picks = []; // { ship, offers, cursor, chosen }

  constructor(catalog = UPGRADES, choices = RULES.upgradeChoices) {
    this.catalog = catalog;
    this.choices = choices;
  }

  start(ships) {
    this.picks = ships.map(ship => {
      const offers = this.#deal(ship);
      return { ship, offers, cursor: Math.floor((offers.length - 1) / 2), chosen: null };
    });
  }

  get done() { return this.picks.every(p => p.chosen); }

  pickFor(ship) { return this.picks.find(p => p.ship === ship); }

  move(pick, dir) {
    if (pick.chosen || !dir) return false;
    const n = pick.offers.length;
    pick.cursor = (pick.cursor + dir + n) % n;
    return true;
  }

  confirm(pick) {
    if (pick.chosen) return false;
    pick.chosen = pick.offers[pick.cursor];
    pick.ship.applyUpgrade(pick.chosen);
    return true;
  }

  // random distinct upgrades the ship has not maxed out yet
  #deal(ship) {
    const open = this.catalog.filter(u => ship.upgradeLevel(u.id) < u.maxLevel);
    for (let i = open.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [open[i], open[j]] = [open[j], open[i]];
    }
    return open.slice(0, this.choices);
  }
}
