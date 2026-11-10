import { RULES } from '../../../config.js';

const MAX_LIFE_ICONS = 8;
const SWITCH_PULSE_MS = 500; // how long the active weapon tag flares after a switch

// Score, lives and weapons in each player's corner, plus wave and mode at the top.
export class HudView {
  #lastWeapon = new WeakMap(); // ship -> { weapon, at } to flare the tag on a switch

  draw(o, { world, waves, session, audio, touch, time = 0 }) {
    const { width: W, height: H } = o;
    o.edgeShade('top', 90);
    o.edgeShade('bottom', 90);
    const corners = [
      { x: 18, y: 22, align: 'left' }, { x: W - 18, y: 22, align: 'right' },
      { x: 18, y: H - 40, align: 'left' }, { x: W - 18, y: H - 40, align: 'right' },
    ];
    for (const s of world.ships) {
      const c = corners[s.index];
      const dir = c.align === 'left' ? 1 : -1;
      o.withAlpha(s.isOut ? 0.35 : 1, () => {
        const scoreText = `${s.name}  ${String(s.score).padStart(6, '0')}`;
        o.text(scoreText, c.x, c.y, 18, s.color, c.align, s.color);
        o.text(`$${s.money}`, c.x + dir * (o.measure(scoreText, 18) + 16), c.y, 18, '#ffd23f', c.align, '#ffd23f');
        for (let i = 0; i < Math.min(s.lives, MAX_LIFE_ICONS); i++) {
          o.shipIcon(c.x + dir * (8 + i * 18), c.y + 22, -Math.PI / 2, s.color, 0.55);
        }
        if (s.isOut) o.text('OUT', c.x, c.y + 22, 14, s.color, c.align);
        else if (!s.controller.isComputer) {
          const x = c.x + dir * (8 + Math.min(s.lives, MAX_LIFE_ICONS) * 18 + 4);
          o.text(s.autoFire ? 'AUTO FIRE' : 'FIRE OFF', x, c.y + 22, 11, s.autoFire ? '#9aa1b2' : '#ff6b6b', c.align);
        }
        else if (s.weapons.length > 1) {
          o.weaponStrip(s.weapons, s.weapon, c.x, c.y + (c.y < H / 2 ? 46 : -24), c.align, this.#pulse(s, time));
        }
      });
    }
    o.text(`${this.#waveText(waves)}  ·  ${session.mode.title}`, W / 2, 22, 13,
      waves.isTimed && waves.timeLeft <= 10 ? '#ffd23f' : '#c3cad8', 'center');
    if (world.boss) o.bossBar(world.boss, W / 2, 46, Math.min(420, W * 0.4));
    if (session.invincible) o.text('INVINCIBLE', W / 2, H - 34, 12, '#ffd23f', 'center', '#ffd23f');
    if (!touch?.enabled && !session.demo) {
      o.text(`P pause · M ${audio.muted ? 'unmute' : 'mute'} · 1-9/0 wave · K +$${RULES.devMoney}${session.invincible ? ' · N next · B boss' : ''}`,
        W / 2, H - 16, 11, '#9aa1b2', 'center');
    }
  }

  // "WAVE 2 · 0:43", or the boss fight
  #waveText(waves) {
    if (!waves.isTimed) return `WAVE ${waves.wave}  ·  ${waves.isFinalWave ? 'FINAL BOSS' : 'BOSS'}`;
    const t = Math.ceil(waves.timeLeft);
    return `WAVE ${waves.wave}  ·  ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  // 1 right after the ship switched weapon, fading to 0
  #pulse(ship, time) {
    const last = this.#lastWeapon.get(ship);
    if (!last) { this.#lastWeapon.set(ship, { weapon: ship.weapon, at: -Infinity }); return 0; }
    if (last.weapon !== ship.weapon) Object.assign(last, { weapon: ship.weapon, at: time });
    return Math.max(0, 1 - (time - last.at) / SWITCH_PULSE_MS);
  }
}
