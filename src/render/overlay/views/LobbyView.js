import { PLAYERS } from '../../../config.js';
import { lobbyLayout } from '../lobbyLayout.js';

export class LobbyView {
  draw(o, { time, session, audio, touch }) {
    const tap = touch?.enabled;
    const { width: W, height: H } = o;
    const layout = lobbyLayout(W, H);
    const small = layout.small;
    const titleY = H * (layout.short ? 0.12 : 0.16);
    o.text('ROCK RUMBLE', W / 2, titleY, small ? 40 : 64, '#e8ecf4', 'center', '#7aa7ff');
    o.text(tap ? 'asteroid shooter · up to 4 pilots' : 'local multiplayer asteroid shooter · up to 4 pilots on one keyboard',
      W / 2, titleY + (small ? 36 : 52), small ? 12 : 15, '#7d8496', 'center');

    PLAYERS.forEach((p, i) => {
      const c = layout.cards[i], on = session.joined[i];
      o.card(c.x, c.y, c.w, c.h, {
        fill: on ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
        stroke: on ? p.color : '#2a2f3d', lineWidth: on ? 2 : 1, glowColor: on ? p.color : null,
      });
      o.text(p.name + (on ? '  READY' : ''), c.x + c.w / 2, c.y + 82, 16, on ? p.color : '#7d8496', 'center');
      if (!layout.short) p.labels.forEach((t, k) => o.text(t, c.x + c.w / 2, c.y + 104 + k * 15, 11, '#9aa1b2', 'center'));
    });

    const by = layout.footerY;
    const mode = session.mode;
    o.text(tap ? 'tap a pilot to join / leave' : 'press a pilot\'s FIRE key to join / leave', W / 2, by, 14, '#9aa1b2', 'center');
    o.text(`${tap ? '⇆' : 'TAB'}  mode: ${mode.title} (${mode.description})`, W / 2, layout.modeY, 15, '#e8ecf4', 'center');
    const n = session.joinedCount;
    if (n > 0 && Math.floor(time / 500) % 2 === 0) {
      o.text(`${tap ? 'TAP' : 'ENTER'}  start with ${n} pilot${n > 1 ? 's' : ''}`, W / 2, layout.startY, 20, '#ffffff', 'center', '#7aa7ff');
    } else if (n === 0) {
      o.text('nobody has joined yet', W / 2, layout.startY, 16, '#7d8496', 'center');
    }
    if (!tap) {
      o.text(`M  sound ${audio.muted ? 'off' : 'on'}  ·  P  pause in game`, W / 2, by + 100, 12, '#545a6a', 'center');
      o.text(`testing: G invincible ${session.invincible ? 'ON' : 'off'}  ·  1-9/0 start at wave${session.invincible ? '  ·  B start at boss' : ''}`,
        W / 2, by + 120, 12, session.invincible ? '#ffd23f' : '#545a6a', 'center');
    }
  }
}
