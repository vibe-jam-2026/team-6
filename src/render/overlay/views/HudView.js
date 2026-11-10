import { RULES, POWERUPS } from '../../../config.js';

const MAX_LIFE_ICONS = 8;
const PICKUP_PULSE_MS = 500; // how long the power-up tag flares after a pickup

// Score, lives and any power-up weapon in each player's corner, plus wave and mode at the top.
export class HudView {
  #lastPowerup = new WeakMap(); // ship -> { weapon, at } to flare the tag on a pickup

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
        const pulse = this.#pulse(s, time);
        if (s.powerup) {
          o.powerupTag(s.powerup, s.powerupTime / POWERUPS.duration, c.x, c.y + (c.y < H / 2 ? 46 : -24), c.align, pulse);
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

  // 1 right after the ship picked up a weapon (or a fresh one), fading to 0
  #pulse(ship, time) {
    const last = this.#lastPowerup.get(ship);
    if (!last) { this.#lastPowerup.set(ship, { weapon: ship.powerup, time: ship.powerupTime, at: -Infinity }); return 0; }
    const fresh = ship.powerup && (last.weapon !== ship.powerup || ship.powerupTime > last.time);
    if (fresh) last.at = time;
    Object.assign(last, { weapon: ship.powerup, time: ship.powerupTime });
    return Math.max(0, 1 - (time - last.at) / PICKUP_PULSE_MS);
  }
}
