// Keeps one 3D view per game entity: creates views for new entities, updates
// existing ones and removes views whose entity is gone. Works with any view
// that has an `object` (THREE.Object3D), update(entity, frame) and dispose().
export class EntityViewSync {
  #views = new Map();

  constructor(scene, createView) {
    this.scene = scene;
    this.createView = createView;
  }

  sync(entities, frame) {
    const seen = new Set();
    for (const e of entities) {
      let view = this.#views.get(e);
      if (!view) {
        view = this.createView(e);
        this.#views.set(e, view);
        this.scene.add(view.object);
      }
      view.update(e, frame);
      seen.add(e);
    }
    for (const [e, view] of this.#views) {
      if (seen.has(e)) continue;
      this.scene.remove(view.object);
      view.dispose?.();
      this.#views.delete(e);
    }
  }
}
