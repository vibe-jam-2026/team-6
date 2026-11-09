import { UPGRADES } from './catalog.js';

// The last line of every pilot's shopping list: done, start the next wave.
export const READY = { id: 'ready', name: 'READY', color: '#e8ecf4', description: 'done shopping' };

// The shop between waves. Every pilot still in the game browses the whole
// catalog with their own cursor, buys whatever they can afford, then marks
// themselves ready. Pure game logic: no input, no drawing.
export class Shop {
  entries = []; // { ship, cursor, ready, notice: { text, ok, timeLeft } | null }

  constructor(catalog = UPGRADES) {
    this.catalog = catalog;
    this.items = [...catalog, READY];
  }

  start(ships) {
    this.entries = ships.map(ship => ({ ship, cursor: 0, ready: false, notice: null }));
  }

  get done() { return this.entries.length > 0 && this.entries.every(e => e.ready); }

  // what the next level of an upgrade costs this ship
  price(ship, upgrade) {
    const level = ship.upgradeLevel(upgrade.id);
    return Math.round(upgrade.cost * upgrade.costGrowth ** level / 5) * 5;
  }

  isMaxed(ship, upgrade) { return ship.upgradeLevel(upgrade.id) >= upgrade.maxLevel; }

  canBuy(ship, upgrade) {
    return !this.isMaxed(ship, upgrade) && ship.money >= this.price(ship, upgrade);
  }

  affordable(ship) { return this.catalog.filter(u => this.canBuy(ship, u)); }

  // browsing again takes a pilot off "ready"
  move(entry, dir) {
    if (!dir) return false;
    const n = this.items.length;
    entry.cursor = (entry.cursor + dir + n) % n;
    entry.ready = false;
    return true;
  }

  // Fire on the highlighted line. Returns what happened:
  // { ready } | { bought, price } | { denied: 'maxed' | 'money' }
  confirm(entry) {
    const item = this.items[entry.cursor];
    if (item === READY) {
      entry.ready = !entry.ready;
      return { ready: entry.ready };
    }
    return this.buy(entry, item);
  }

  buy(entry, upgrade) {
    const { ship } = entry;
    if (this.isMaxed(ship, upgrade)) return this.#notice(entry, { denied: 'maxed' }, `${upgrade.name} is maxed out`, false);
    const price = this.price(ship, upgrade);
    if (ship.money < price) return this.#notice(entry, { denied: 'money' }, `need $${price - ship.money} more`, false);
    ship.spend(price);
    ship.applyUpgrade(upgrade);
    entry.ready = false;
    return this.#notice(entry, { bought: upgrade, price }, `bought ${upgrade.name}`, true);
  }

  // computer pilots jump straight to a line
  pointAt(entry, item) {
    entry.cursor = Math.max(0, this.items.indexOf(item));
  }

  // fades the little "bought ..." / "need $..." line under each list
  tick(dt) {
    for (const e of this.entries) if (e.notice && (e.notice.timeLeft -= dt) <= 0) e.notice = null;
  }

  #notice(entry, result, text, ok) {
    entry.notice = { text, ok, timeLeft: 1.6 };
    return result;
  }
}
