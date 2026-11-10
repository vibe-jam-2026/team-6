import { WAVES } from '../../../config.js';
import { drawHighScores } from './highScoreTable.js';

const TABLE_ROWS = 5;

export class GameOverView {
  draw(o, { session, touch, highScores, time = 0 }) {
    const result = session.result;
    if (!result) return;
    const W = o.width, entry = session.scoreEntry;
    const extra = result.won ? 30 : 0; // room for the "all waves cleared" line
    const entryH = entry ? 74 : 0;
    const tableRows = Math.min(TABLE_ROWS, Math.max(1, highScores?.entries.length ?? 0));
    const tableH = highScores && o.height > 560 ? 46 + tableRows * 19 : 0;
    const h = 170 + extra + result.ranked.length * 34 + entryH + tableH;
    const pw = Math.min(460, W - 32);
    const { y } = o.panel(pw, h);
    if (result.won) {
      const pulse = 0.85 + 0.15 * Math.sin(time / 180);
      o.withAlpha(pulse, () => o.text('★ VICTORY ★', W / 2, y + 42, 40, '#ffe9a8', 'center', '#ffd23f'));
      o.text(`ALL ${WAVES.final} WAVES CLEARED`, W / 2, y + 80, 15, '#ffd23f', 'center');
    } else {
      o.text('GAME OVER', W / 2, y + 40, 32, '#e8ecf4', 'center', '#7aa7ff');
    }
    o.text(result.headline, W / 2, y + 76 + extra, 14, '#9aa1b2', 'center');
    result.ranked.forEach((s, k) => {
      const ry = y + 116 + extra + k * 34;
      const crown = k === 0 && result.multiplayer ? '★ ' : '  ';
      o.text(`${crown}${s.name}`, W / 2 - 150, ry, 18, s.color, 'left');
      o.text(String(s.score), W / 2 + 40, ry, 18, '#e8ecf4', 'right');
      if (result.showKills) o.text(`${s.kills} kill${s.kills === 1 ? '' : 's'}`, W / 2 + 150, ry, 13, '#7d8496', 'right');
    });
    let cy = y + 116 + extra + result.ranked.length * 34;
    if (entry) {
      o.text(`NEW HIGH SCORE · ${entry.ship.name}`, W / 2, cy + 6, 16, entry.ship.color, 'center', entry.ship.color);
      const cursor = Math.floor(time / 400) % 2 ? '_' : ' ';
      const typed = (entry.initials + (entry.initials.length < 3 ? cursor : '')).padEnd(3, '·').split('').join(' ');
      o.text(typed, W / 2, cy + 34, 24, '#ffffff', 'center', '#7aa7ff');
      o.text(touch?.enabled ? 'TAP  save' : 'type your initials · ENTER  save', W / 2, cy + 58, 11, '#9aa1b2', 'center');
      cy += entryH;
    }
    if (tableH) drawHighScores(o, highScores.top(TABLE_ROWS), { x: W / 2, y: cy + 14, width: Math.min(300, pw - 60), highlight: session.newHighScores, time });
    if (!entry) o.text(touch?.enabled ? 'TAP  back to lobby' : 'ENTER  back to lobby', W / 2, y + h - 28, 14, '#ffffff', 'center');
  }
}
