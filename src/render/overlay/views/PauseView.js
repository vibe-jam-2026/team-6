export class PauseView {
  draw(o, { touch }) {
    const { width: W, height: H } = o;
    o.panel(340, 150);
    o.text('PAUSED', W / 2, H / 2 - 30, 30, '#e8ecf4', 'center');
    if (!touch?.enabled) o.text('P resume · Q quit to lobby', W / 2, H / 2 + 20, 14, '#9aa1b2', 'center');
  }
}
