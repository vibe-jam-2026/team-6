import { READY } from '../../../upgrades/Shop.js';
import { WAVES } from '../../../config.js';

const MONEY = '#ffd23f';
const TOO_DEAR = '#c45a66';
const COL_GAP = 16;

// The shop between waves: one column per pilot with their money, the whole
// catalog (price and level for each line), and READY at the bottom.
export class ShopView {
  draw(o, { shop, waves, time }) {
    const entries = shop.entries;
    if (!entries.length) return;
    const { width: W, height: H } = o;
    const rows = shop.items.length;
    const rowH = Math.max(20, Math.min(30, (H - 250) / rows));
    const pw = Math.min(W - 32, 420 * entries.length + 32);
    const ph = 132 + rows * rowH + 60;
    const { x, y } = o.panel(pw, ph);

    o.text(`WAVE ${waves.wave} COMPLETE · SHOP`, W / 2, y + 28, 22, '#e8ecf4', 'center', '#7aa7ff');
    o.text('turn keys browse · fire buys · pick READY when done', W / 2, y + 54, 12, '#9aa1b2', 'center');

    const colW = (pw - 32 - COL_GAP * (entries.length - 1)) / entries.length;
    const next = waves.wave + 1;
    const nextLabel = !waves.isBossWave(next) ? 'NEXT WAVE' : next >= WAVES.final ? 'FINAL BOSS' : 'BOSS';
    entries.forEach((entry, i) => this.#column(o, shop, entry, {
      x: x + 16 + i * (colW + COL_GAP), y: y + 76, w: colW, rowH, time, nextLabel,
    }));
  }

  #column(o, shop, entry, { x, y, w, rowH, time, nextLabel }) {
    const { ship, cursor, ready, notice } = entry;
    const pulse = 0.5 + 0.5 * Math.sin(time / 140);
    o.text(ship.name, x + 4, y + 10, 18, ship.color, 'left', ship.color);
    o.text(`$${ship.money}`, x + w - 4, y + 10, 18, MONEY, 'right', MONEY);
    o.text(ready ? 'READY ✓' : 'shopping', x + 4, y + 32, 11, ready ? ship.color : '#7d8496');

    const top = y + 46;
    shop.items.forEach((item, row) => {
      const ry = top + row * rowH;
      const selected = row === cursor;
      if (selected) {
        o.card(x, ry, w, rowH - 3, {
          fill: 'rgba(255,255,255,0.08)', stroke: ship.color,
          lineWidth: ready ? 2.5 : 1 + pulse, glowColor: ship.color,
        });
      }
      const cy = ry + (rowH - 3) / 2;
      if (item === READY) {
        const label = `READY ▸ ${nextLabel}`;
        o.text(ready ? `✓ ${label}` : label, x + w / 2, cy, 13, ready ? ship.color : '#e8ecf4', 'center');
        return;
      }
      const level = ship.upgradeLevel(item.id);
      const maxed = shop.isMaxed(ship, item);
      const price = shop.price(ship, item);
      const dim = !maxed && ship.money < price;
      o.withAlpha(maxed || dim ? 0.55 : 1, () => {
        o.text(item.name, x + 10, cy, 13, item.color, 'left', selected ? item.color : null);
        const levelText = item.maxLevel === Infinity ? `×${level}` : `${level}/${item.maxLevel}`;
        o.text(levelText, x + w - 78, cy, 11, '#9aa1b2', 'right');
        if (maxed) o.text('MAX', x + w - 10, cy, 13, '#9aa1b2', 'right');
        else o.text(`$${price}`, x + w - 10, cy, 13, dim ? TOO_DEAR : MONEY, 'right');
      });
    });

    // what the highlighted line does, and the result of the last purchase
    const by = top + shop.items.length * rowH + 14;
    const item = shop.items[cursor];
    o.text(item.description, x + 4, by, 12, '#c9cfdc');
    if (notice) {
      o.withAlpha(Math.min(1, notice.timeLeft * 2), () =>
        o.text(notice.text, x + 4, by + 22, 12, notice.ok ? '#9dff5c' : '#ff6b6b'));
    }
  }
}
