import { PLAYERS, MOUSE_LABELS, COMPUTER_LABELS, COMPUTER_PLAYER, DEMO } from '../../../config.js';
import { lobbyLayout } from '../lobbyLayout.js';
import { drawHighScores } from './highScoreTable.js';
import { VERSION } from '../../../version.js';

export class LobbyView {
  draw(o, { time, session, audio, touch, cameraView, highScores }) {
    const tap = touch?.enabled;
    const { width: W, height: H } = o;
    const layout = lobbyLayout(W, H);
    const small = layout.small;
    o.dim(0.32);
    o.text(`version ${VERSION}`, 10, H - 12, 11, '#7d8496', 'left');
    const titleY = H * (layout.short ? 0.12 : 0.16);
    o.text('MACH MANIA', W / 2, titleY, small ? 40 : 64, '#e8ecf4', 'center', '#7aa7ff');
    o.text(tap ? 'fighter-jet shooter · 2 pilots' : 'local multiplayer fighter-jet shooter · 2 pilots on one keyboard',
      W / 2, titleY + (small ? 36 : 52), small ? 12 : 15, '#7d8496', 'center');

    PLAYERS.forEach((p, i) => {
      const c = layout.cards[i], on = session.joined[i];
      o.card(c.x, c.y, c.w, c.h, {
        fill: on ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
        stroke: on ? p.color : '#2a2f3d', lineWidth: on ? 2 : 1, glowColor: on ? p.color : null,
      });
      const cpu = session.computer[i];
      o.text(p.name + (cpu ? '  CPU' : '') + (on ? '  READY' : ''), c.x + c.w / 2, c.y + 82, 16, on ? p.color : '#7d8496', 'center');
      const mouse = !tap && !cpu && session.mouseOwner === i;
      const labels = cpu ? COMPUTER_LABELS.map(t => tap ? t.replace('V', 'tap') : t) : mouse ? MOUSE_LABELS : p.labels;
      if (!layout.short) labels.forEach((t, k) => o.text(t, c.x + c.w / 2, c.y + 104 + k * 15, 11, mouse || cpu ? p.color : '#9aa1b2', 'center'));
    });

    // the best scores, beside the pilot cards when there is room
    const cardsRight = Math.max(...layout.cards.map(c => c.x + c.w));
    if (highScores && W - cardsRight > 300) {
      const x = (cardsRight + W) / 2;
      drawHighScores(o, highScores.top(5), { x, y: layout.cards[0].y + 12, width: Math.min(240, W - cardsRight - 60), time });
    }

    const by = layout.footerY;
    const mode = session.mode;
    o.text(tap ? 'tap P1 to join · tap P2 for a computer pilot' : 'press a pilot\'s FIRE key to join / leave', W / 2, by, 14, '#9aa1b2', 'center');
    o.text(`${tap ? '⇆' : 'TAB'}  mode: ${mode.title} (${mode.description})`, W / 2, layout.modeY, 15, '#e8ecf4', 'center');
    const n = session.joinedCount;
    if (n > 0 && Math.floor(time / 500) % 2 === 0) {
      o.text(`${tap ? 'TAP' : 'ENTER'}  start with ${n} pilot${n > 1 ? 's' : ''}`, W / 2, layout.startY, 20, '#ffffff', 'center', '#7aa7ff');
    } else if (n === 0) {
      o.text('nobody has joined yet', W / 2, layout.startY, 16, '#7d8496', 'center');
    }
    if (!tap) {
      const owner = session.mouseOwner === null ? 'nobody (keyboard only)' : PLAYERS[session.mouseOwner].name;
      const cpu = PLAYERS[COMPUTER_PLAYER];
      o.text(`V  ${cpu.name} flown by: ${session.computer[COMPUTER_PLAYER] ? 'the computer' : 'a player'}`, W / 2 - 140, by + 96, 13,
        session.computer[COMPUTER_PLAYER] ? cpu.color : '#9aa1b2', 'center');
      const skill = session.cpuSkill;
      o.text(`L  computer skill: ${skill.name}`, W / 2 + 150, by + 96, 13, skill.color, 'center');
      o.text(`C  mouse control: ${owner}`, W / 2, by + 114, 13,
        session.mouseOwner === null ? '#9aa1b2' : PLAYERS[session.mouseOwner].color, 'center');
      if (session.humanCount === 1) o.text('flying solo: SPACE works as your fire key too', W / 2, by + 132, 11, '#7d8496', 'center');
      o.text(`M  sound ${audio.muted ? 'off' : 'on'}  ·  P  pause in game  ·  F  camera: ${cameraView?.() ?? 'overview'}  ·  X  demo (starts by itself after ${DEMO.idleTime} s idle)`, W / 2, by + 152, 12, '#545a6a', 'center');
      o.text(`testing: ${session.invincible ? 'INVINCIBLE  ·  ' : ''}1-9/0 start at wave${session.invincible ? '  ·  B start at boss' : ''}`,
        W / 2, by + 172, 12, session.invincible ? '#ffd23f' : '#545a6a', 'center');
    }
  }
}
