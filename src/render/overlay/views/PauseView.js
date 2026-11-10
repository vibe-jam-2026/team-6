export class PauseView {
  draw(o, { session, touch }) {
    const { width: W, height: H } = o;
    if (touch?.enabled) {
      o.panel(340, 150);
      o.text('PAUSED', W / 2, H / 2 - 30, 30, '#e8ecf4', 'center');
      return;
    }
    o.panel(380, 190);
    o.text('PAUSED', W / 2, H / 2 - 45, 30, '#e8ecf4', 'center');
    o.text('P resume · Q quit to lobby', W / 2, H / 2 + 5, 14, '#9aa1b2', 'center');
    o.text('testing: 1-9/0 jump to wave', W / 2, H / 2 + 38, 12, '#7d8496', 'center');
    if (session.invincible) o.text('N next wave · B next boss (after unpausing)', W / 2, H / 2 + 58, 12, '#7d8496', 'center');
  }
}
