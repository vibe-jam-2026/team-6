// Big fading announcement such as "WAVE 3".
export class BannerView {
  draw(o, { session }) {
    const { text, timeLeft } = session.banner;
    if (timeLeft <= 0) return;
    o.withAlpha(Math.min(1, timeLeft), () =>
      o.text(text, o.width / 2, o.height / 2 - 120, 34, '#e8ecf4', 'center', '#7aa7ff'));
  }
}
