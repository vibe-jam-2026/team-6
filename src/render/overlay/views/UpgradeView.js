const ROW_H = 92;
const LABEL_W = 78;
const GAP = 12;

// The between-waves picker: one row per player, each with its upgrade cards.
export class UpgradeView {
  draw(o, { upgrades, waves, time }) {
    const picks = upgrades.picks;
    if (!picks.length) return;
    const W = o.width;
    const pw = Math.min(W - 32, 820);
    const ph = 104 + picks.length * ROW_H;
    const { x, y } = o.panel(pw, ph);

    o.text(`WAVE ${waves.wave} CLEARED`, W / 2, y + 30, 24, '#e8ecf4', 'center', '#7aa7ff');
    o.text('choose an upgrade · turn keys to browse · fire to take it', W / 2, y + 60, 12, '#9aa1b2', 'center');

    picks.forEach((pick, row) => this.#row(o, pick, x + 16, y + 84 + row * ROW_H, pw - 32, time));
  }

  #row(o, pick, x, y, w, time) {
    const { ship, offers, cursor, chosen } = pick;
    const cardH = ROW_H - 14;
    o.text(ship.name, x + 4, y + cardH / 2 - 8, 18, ship.color, 'left', ship.color);
    o.text(chosen ? 'READY' : 'picking', x + 4, y + cardH / 2 + 14, 11, chosen ? ship.color : '#545a6a');

    const cardW = (w - LABEL_W - GAP * (offers.length - 1)) / offers.length;
    offers.forEach((upgrade, i) => {
      const cx = x + LABEL_W + i * (cardW + GAP);
      const selected = i === cursor;
      const taken = chosen === upgrade;
      const faded = chosen && !taken;
      const pulse = 0.5 + 0.5 * Math.sin(time / 140);
      o.withAlpha(faded ? 0.3 : 1, () => {
        o.card(cx, y, cardW, cardH, {
          fill: taken ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
          stroke: selected ? ship.color : '#2a2f3d',
          lineWidth: selected ? (taken ? 3 : 1.5 + pulse) : 1,
          glowColor: selected ? ship.color : null,
        });
        const level = ship.upgradeLevel(upgrade.id);
        o.text(upgrade.name, cx + 12, y + 20, 14, upgrade.color, 'left', selected ? upgrade.color : null);
        o.text(upgrade.description, cx + 12, y + 44, 11, '#c9cfdc');
        const levelText = upgrade.maxLevel === Infinity
          ? `have ${level}`
          : `level ${taken ? level : level + 1} / ${upgrade.maxLevel}`;
        o.text(taken ? `✓ ${levelText}` : levelText, cx + 12, y + 64, 10, '#7d8496');
      });
    });
  }
}
