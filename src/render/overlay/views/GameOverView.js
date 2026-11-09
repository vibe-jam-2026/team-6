export class GameOverView {
  draw(o, { session }) {
    const result = session.result;
    if (!result) return;
    const W = o.width;
    const h = 170 + result.ranked.length * 34;
    const { y } = o.panel(Math.min(460, W - 32), h);
    o.text('GAME OVER', W / 2, y + 40, 32, '#e8ecf4', 'center', '#7aa7ff');
    o.text(result.headline, W / 2, y + 76, 14, '#9aa1b2', 'center');
    result.ranked.forEach((s, k) => {
      const ry = y + 116 + k * 34;
      const crown = k === 0 && result.multiplayer ? '★ ' : '  ';
      o.text(`${crown}${s.name}`, W / 2 - 150, ry, 18, s.color, 'left');
      o.text(String(s.score), W / 2 + 40, ry, 18, '#e8ecf4', 'right');
      if (result.showKills) o.text(`${s.kills} kill${s.kills === 1 ? '' : 's'}`, W / 2 + 150, ry, 13, '#7d8496', 'right');
    });
    o.text('ENTER  back to lobby', W / 2, y + h - 28, 14, '#ffffff', 'center');
  }
}
