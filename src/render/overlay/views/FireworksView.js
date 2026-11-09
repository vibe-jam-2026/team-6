// Draws the victory fireworks (see effects/Fireworks.js) as glowing sparks.
export class FireworksView {
  constructor(fireworks) {
    this.fireworks = fireworks;
  }

  draw(o) {
    const { rockets, sparks } = this.fireworks;
    if (!rockets.length && !sparks.length) return;
    o.sparks([
      ...rockets.map(r => ({ x: r.x, y: r.y, size: 3, alpha: 1, color: '#fff3d0' })),
      ...sparks.map(s => ({ x: s.x, y: s.y, size: s.size, alpha: Math.min(1, s.life / s.max * 1.5), color: s.color })),
    ]);
  }
}
