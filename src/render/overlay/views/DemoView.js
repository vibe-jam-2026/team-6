// While the computer flies a demo: a pulsing label telling people how to leave it.
export class DemoView {
  draw(o, { session, time = 0 }) {
    if (!session.demo) return;
    const { width: W, height: H } = o;
    const pulse = 0.65 + 0.35 * Math.sin(time / 300);
    o.withAlpha(pulse, () => {
      o.text('DEMO', W / 2, H - 78, 26, '#ffffff', 'center', '#7aa7ff');
    });
    o.text('press ESC to exit the demo', W / 2, H - 54, 13, '#c3cad8', 'center');
  }
}
