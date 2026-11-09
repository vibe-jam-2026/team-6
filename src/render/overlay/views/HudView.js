const MAX_LIFE_ICONS = 8;

// Score and lives in each player's corner, plus wave and mode at the top.
export class HudView {
  draw(o, { world, waves, session, audio }) {
    const { width: W, height: H } = o;
    const corners = [
      { x: 18, y: 22, align: 'left' }, { x: W - 18, y: 22, align: 'right' },
      { x: 18, y: H - 40, align: 'left' }, { x: W - 18, y: H - 40, align: 'right' },
    ];
    for (const s of world.ships) {
      const c = corners[s.index];
      const dir = c.align === 'left' ? 1 : -1;
      o.withAlpha(s.isOut ? 0.35 : 1, () => {
        o.text(`${s.name}  ${String(s.score).padStart(6, '0')}`, c.x, c.y, 18, s.color, c.align, s.color);
        for (let i = 0; i < Math.min(s.lives, MAX_LIFE_ICONS); i++) {
          o.shipIcon(c.x + dir * (8 + i * 18), c.y + 22, -Math.PI / 2, s.color, 0.55);
        }
        if (s.isOut) o.text('OUT', c.x, c.y + 22, 14, s.color, c.align);
      });
    }
    o.text(`WAVE ${waves.wave}  ·  ${session.mode.title}`, W / 2, 22, 13, '#7d8496', 'center');
    o.text(`P pause · M ${audio.muted ? 'unmute' : 'mute'}`, W / 2, H - 16, 11, '#545a6a', 'center');
  }
}
