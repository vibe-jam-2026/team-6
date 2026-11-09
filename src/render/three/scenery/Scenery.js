import * as THREE from 'three';
import { forest } from './forest.js';
import { coast } from './coast.js';
import { alps } from './alps.js';

const THEMES = { forest, coast, alps };

// The landscape the dogfight happens above. show(key) switches theme (the
// renderer picks one per wave); fit() rebuilds it when the window resizes.
export class Scenery {
  #key = null;
  #viewport = null;

  constructor(scene, lighting) {
    this.scene = scene;
    this.lighting = lighting;
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  fit(viewport, cameraDistance) {
    this.#viewport = viewport;
    this.cameraDistance = cameraDistance;
    if (this.#key) this.#build();
  }

  show(key) {
    if (key === this.#key) return;
    this.#key = key;
    if (this.#viewport) this.#build();
  }

  #build() {
    this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    this.group.clear();
    const theme = THEMES[this.#key];
    const { width: w, height: h } = this.#viewport;
    this.group.add(...theme.build(w, h));
    const { sky } = theme.mood;
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, this.cameraDistance * 1.15, this.cameraDistance * 2.6);
    this.lighting.setMood(theme.mood);
  }
}
