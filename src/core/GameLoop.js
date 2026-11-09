// Fixed-timestep simulation with a variable-rate render.
export class GameLoop {
  constructor({ update, render, step = 1 / 60, maxFrame = 0.1 }) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxFrame = maxFrame;
  }

  start() {
    let last = performance.now(), acc = 0;
    const frame = now => {
      acc += Math.min(this.maxFrame, (now - last) / 1000);
      last = now;
      while (acc >= this.step) {
        this.update(this.step);
        acc -= this.step;
      }
      this.render(now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
