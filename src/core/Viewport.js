// The browser window size, which is also the size of the playfield.
// Acts as the world bounds: anything that leaves one edge re-enters at the opposite one.
export class Viewport {
  #listeners = [];

  constructor(win = window) {
    this.win = win;
    this.#measure();
    win.addEventListener('resize', () => {
      this.#measure();
      this.#listeners.forEach(fn => fn(this));
    });
  }

  #measure() {
    this.width = this.win.innerWidth;
    this.height = this.win.innerHeight;
    this.pixelRatio = Math.min(this.win.devicePixelRatio || 1, 2);
  }

  onResize(fn) {
    this.#listeners.push(fn);
    fn(this);
  }

  wrap(o) {
    if (o.x < 0) o.x += this.width; else if (o.x >= this.width) o.x -= this.width;
    if (o.y < 0) o.y += this.height; else if (o.y >= this.height) o.y -= this.height;
  }
}
