// Draws the 2D views registered for the current game state, in order.
// New screens are added by registering views; this class does not change.
export class OverlayRenderer {
  #views = new Map();

  constructor(overlay, states, context) {
    this.overlay = overlay;
    this.states = states;
    this.context = context; // read-only game state the views draw from
  }

  register(stateName, views) {
    this.#views.set(stateName, views);
    return this;
  }

  render(time) {
    this.overlay.clear();
    const frame = { ...this.context, time };
    for (const view of this.#views.get(this.states.currentName) ?? []) view.draw(this.overlay, frame);
  }
}
