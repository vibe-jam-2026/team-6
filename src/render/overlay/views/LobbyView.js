import { PLAYERS, MOUSE_LABELS, COMPUTER_LABELS, COMPUTER_PLAYER, DEMO, BOSS } from '../../../config.js';
import { lobbyLayout } from '../lobbyLayout.js';
import { drawHighScores } from './highScoreTable.js';
import { VERSION } from '../../../version.js';

const DIM = '#7d8496';
const TEXT = '#e8ecf4';
const ACCENT = '#7aa7ff';

// The main menu: pilot cards, a start button and a grid of option buttons.
// Every card and button can be clicked or tapped (see LobbyPointer) and also
// shows the hotkey that does the same thing.
export class LobbyView {
  draw(o, { time, session, audio, touch, cameraView, highScores, pointer }) {
    const tap = !!touch?.enabled;
    const { width: W, height: H } = o;
    const layout = lobbyLayout(W, H, { tap });
    const small = layout.small;
    const hovered = r => !tap && pointer?.hover?.key === r.key;
    o.dim(0.32);
    o.text(`version ${VERSION}`, 10, H - 12, 11, DIM, 'left');
    const titleY = H * (layout.short ? 0.1 : 0.13);
    o.text('MACH MANIA', W / 2, titleY, small || layout.short ? 40 : 64, TEXT, 'center', ACCENT);
    if (!layout.short) {
      o.text(tap ? 'fighter-jet shooter · 2 pilots' : 'local multiplayer fighter-jet shooter · 2 pilots on one keyboard',
        W / 2, titleY + (small ? 34 : 48), small ? 12 : 15, DIM, 'center');
    }

    this.#cards(o, layout, session, tap, hovered);

    // the best scores, beside the pilot cards when there is room
    const cardsRight = Math.max(...layout.cards.map(c => c.x + c.w));
    if (highScores && W - cardsRight > 300) {
      const x = (cardsRight + W) / 2;
      drawHighScores(o, highScores.top(5), { x, y: layout.cards[0].y + 12, width: Math.min(240, W - cardsRight - 60), time });
    }

    o.text(tap ? 'tap P1 to join · tap P2 for a computer pilot' : 'click a pilot or press their FIRE key to join / leave',
      W / 2, layout.footerY, layout.short ? 11 : 13, '#9aa1b2', 'center');
    this.#startButton(o, layout.start, session, time, tap, hovered(layout.start));

    const values = this.#optionValues(session, audio, cameraView);
    for (const b of layout.buttons) this.#optionButton(o, b, values[b.id], tap, hovered(b));
    if (layout.waves) this.#waveRow(o, layout.waves, session, hovered);

    // notes: what the mode means, plus a hint for solo pilots
    const notes = [`${session.mode.title}: ${session.mode.description}`];
    if (!tap && session.humanCount === 1) notes.push('flying solo: SPACE works as your fire key too');
    if (!tap) notes.push(`P pauses in game · the demo starts by itself after ${DEMO.idleTime} s idle`);
    notes.forEach((t, k) => {
      if (layout.noteY + k * 16 < H - 20) o.text(t, W / 2, layout.noteY + k * 16, 11, k ? '#545a6a' : DIM, 'center');
    });
  }

  #cards(o, layout, session, tap, hovered) {
    PLAYERS.forEach((p, i) => {
      const c = layout.cards[i], on = session.joined[i], hover = hovered(c);
      o.card(c.x, c.y, c.w, c.h, {
        fill: on ? 'rgba(255,255,255,0.05)' : `rgba(255,255,255,${hover ? 0.06 : 0.015})`,
        stroke: on || hover ? p.color : '#2a2f3d', lineWidth: on ? 2 : 1, glowColor: on ? p.color : null,
      });
      const cpu = session.computer[i];
      const status = on ? 'READY' : (tap ? 'tap to join' : 'click to join');
      o.text(`${p.name}${cpu ? '  CPU' : ''}  ${status}`, c.x + c.w / 2, c.y + 82, on ? 16 : 13, on ? p.color : '#9aa1b2', 'center');
      const mouse = !tap && !cpu && session.mouseOwner === i;
      const labels = cpu ? COMPUTER_LABELS.map(t => tap ? t.replace('V', 'tap') : t) : mouse ? MOUSE_LABELS : p.labels;
      if (!layout.short) labels.forEach((t, k) => o.text(t, c.x + c.w / 2, c.y + 104 + k * 15, 11, mouse || cpu ? p.color : '#9aa1b2', 'center'));
    });
  }

  #startButton(o, r, session, time, tap, hover) {
    const n = session.joinedCount, ready = n > 0;
    const pulse = ready ? 0.5 + 0.5 * Math.sin(time / 260) : 0;
    o.card(r.x, r.y, r.w, r.h, {
      fill: ready ? `rgba(122,167,255,${0.14 + pulse * 0.1 + (hover ? 0.12 : 0)})` : 'rgba(255,255,255,0.03)',
      stroke: ready ? ACCENT : '#2a2f3d', lineWidth: ready ? 2 + (hover ? 1 : 0) : 1, glowColor: ready ? ACCENT : null,
    });
    const label = ready ? `START  ·  ${n} PILOT${n > 1 ? 'S' : ''}` : 'JOIN A PILOT TO START';
    const size = r.h < 40 ? 15 : 19;
    o.text(label, r.x + r.w / 2 - (tap ? 0 : 18), r.y + r.h / 2 + 1, size, ready ? '#ffffff' : DIM, 'center', ready ? ACCENT : null);
    if (!tap) this.#keyBadge(o, 'ENTER', r.x + r.w - 10, r.y + r.h / 2, ready ? ACCENT : DIM);
  }

  // what each option currently says: { value, color, dim }
  #optionValues(session, audio, cameraView) {
    const cpuPlayer = PLAYERS[COMPUTER_PLAYER], cpuOn = session.computer[COMPUTER_PLAYER];
    const anyCpu = session.computer.some(Boolean);
    const owner = session.mouseOwner;
    return {
      mode: { value: session.mode.title, color: TEXT },
      computer: { value: cpuOn ? 'COMPUTER' : 'PLAYER', color: cpuOn ? cpuPlayer.color : TEXT },
      cpuSkill: { value: session.cpuSkill.name, color: session.cpuSkill.color, dim: !anyCpu },
      mouse: { value: owner === null ? 'OFF' : PLAYERS[owner].name, color: owner === null ? '#9aa1b2' : PLAYERS[owner].color },
      camera: { value: (cameraView?.() ?? 'overview').toUpperCase(), color: TEXT },
      sound: { value: audio.muted ? 'OFF' : 'ON', color: audio.muted ? '#ff6b6b' : TEXT },
      demo: { value: 'WATCH ▶', color: TEXT },
      invincible: { value: session.invincible ? 'ON' : 'OFF', color: session.invincible ? '#ffd23f' : '#9aa1b2' },
    };
  }

  // a two-line button: the option's name over its current value, with the hotkey on the right
  #optionButton(o, b, { value, color, dim }, tap, hover) {
    o.withAlpha(dim ? 0.5 : 1, () => {
      o.card(b.x, b.y, b.w, b.h, {
        fill: `rgba(10,14,24,${hover ? 0.85 : 0.6})`, stroke: hover ? color : '#3a4152', lineWidth: hover ? 1.5 : 1,
      });
      const x = b.x + 10, badgeW = tap ? 0 : o.measure(b.hint, 10) + 18;
      // the value shrinks to fit beside the key badge on narrow buttons
      const fit = (size, room) => { while (size > 9 && o.measure(value, size) > room) size--; return size; };
      if (b.h >= 36) {
        o.text(b.label, x, b.y + 12, 10, '#9aa1b2', 'left');
        o.text(value, x, b.y + b.h - 12, fit(13, b.w - 14 - badgeW), color, 'left');
      } else {
        const vx = x + o.measure(b.label, 10) + 8;
        o.text(b.label, x, b.y + b.h / 2, 10, '#9aa1b2', 'left');
        o.text(value, vx, b.y + b.h / 2, fit(12, b.x + b.w - 6 - badgeW - vx), color, 'left');
      }
      if (!tap) this.#keyBadge(o, b.hint, b.x + b.w - 8, b.y + b.h / 2, '#7d8496');
    });
  }

  // "start at wave" and a small button per wave (the boss waves in red)
  #waveRow(o, waves, session, hovered) {
    const ready = session.joinedCount > 0;
    o.withAlpha(ready ? 1 : 0.45, () => {
      o.text('start at wave', waves.labelX, waves.y, 11, '#7d8496', 'right');
      for (const b of waves.buttons) {
        const boss = b.wave % BOSS.every === 0, hover = ready && hovered(b);
        const color = boss ? '#ff6b7d' : '#c3cad8';
        o.card(b.x, b.y, b.w, b.h, { fill: `rgba(10,14,24,${hover ? 0.85 : 0.55})`, stroke: hover ? color : '#2f3544', lineWidth: 1 });
        o.text(String(b.wave), b.x + b.w / 2, b.y + b.h / 2 + 1, 11, color, 'center');
      }
    });
  }

  // a small boxed key name, right-aligned at x
  #keyBadge(o, key, x, y, color) {
    const w = o.measure(key, 10) + 10, h = 16;
    o.card(x - w, y - h / 2, w, h, { fill: 'rgba(255,255,255,0.04)', stroke: '#3a4152', lineWidth: 1 });
    o.text(key, x - w / 2, y + 0.5, 10, color, 'center');
  }
}
