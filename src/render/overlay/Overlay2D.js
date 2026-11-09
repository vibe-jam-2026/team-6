const FONT = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

// Drawing primitives for the 2D layer that sits on top of the 3D view.
export class Overlay2D {
  constructor(canvas, viewport) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.viewport = viewport;
    viewport.onResize(({ width, height, pixelRatio }) => {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    });
  }

  get width() { return this.viewport.width; }
  get height() { return this.viewport.height; }

  clear() {
    const { ctx, viewport: v } = this;
    ctx.setTransform(v.pixelRatio, 0, 0, v.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, v.width, v.height);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  glow(color, blur) {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
  }

  text(str, x, y, size, color, align = 'left', glowColor = null) {
    const ctx = this.ctx;
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    if (glowColor) this.glow(glowColor, 16); else ctx.shadowBlur = 0;
    ctx.fillText(str, x, y);
    ctx.shadowBlur = 0;
  }

  withAlpha(alpha, draw) {
    const prev = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    draw();
    this.ctx.globalAlpha = prev;
  }

  // darken the whole 3D view behind a menu
  dim(alpha) {
    this.ctx.fillStyle = `rgba(4,6,12,${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // a dark band fading out from the top or bottom edge, so text stays readable over bright ground
  edgeShade(edge, depth, alpha = 0.6) {
    const ctx = this.ctx, top = edge === 'top';
    const y0 = top ? 0 : this.height, y1 = top ? depth : this.height - depth;
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, `rgba(4,6,12,${alpha})`);
    grad.addColorStop(1, 'rgba(4,6,12,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.min(y0, y1), this.width, depth);
  }

  // a horizontal strip across the screen centred on y, soft at both ends
  band(y, height, alpha) {
    const ctx = this.ctx, grad = ctx.createLinearGradient(0, 0, this.width, 0);
    grad.addColorStop(0, 'rgba(4,6,12,0)');
    grad.addColorStop(0.3, `rgba(4,6,12,${alpha})`);
    grad.addColorStop(0.7, `rgba(4,6,12,${alpha})`);
    grad.addColorStop(1, 'rgba(4,6,12,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - height / 2, this.width, height);
  }

  // a centred dark panel; returns its top-left corner
  panel(w, h) {
    const ctx = this.ctx;
    const x = this.width / 2 - w / 2, y = this.height / 2 - h / 2;
    ctx.fillStyle = 'rgba(5,6,10,0.82)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2a2f3d';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    return { x, y };
  }

  card(x, y, w, h, { fill, stroke, lineWidth = 1, glowColor = null }) {
    const ctx = this.ctx;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    if (glowColor) this.glow(glowColor, 12);
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  // boss health bar centred on x, with its name above
  bossBar(boss, x, y, w) {
    const ctx = this.ctx, h = 8, left = x - w / 2;
    this.text(boss.entering ? 'WARNING · BOSS INCOMING' : `BOSS ${'I'.repeat(Math.min(boss.level, 5))}`,
      x, y, 12, boss.color, 'center', boss.color);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(left, y + 12, w, h);
    ctx.fillStyle = boss.color;
    this.glow(boss.color, 12);
    ctx.fillRect(left, y + 12, w * (boss.entering ? boss.entryProgress : boss.health), h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2a2f3d';
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, y + 12.5, w - 1, h - 1);
  }

  // small ship outline, used as a lives icon
  shipIcon(x, y, angle, color, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    this.glow(color, 12);
    ctx.beginPath();
    ctx.moveTo(16, 0); ctx.lineTo(-11, -10); ctx.lineTo(-6, 0); ctx.lineTo(-11, 10); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
