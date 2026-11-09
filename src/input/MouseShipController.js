import { MOUSE } from './MouseInput.js';

const AIM_GAIN = 4;      // turn input per radian off target, so the nose settles instead of jittering
const DEAD_ZONE = 18;    // px: pointer this close to the ship doesn't steer

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

// Flies a ship with the mouse: the nose turns towards the pointer, the left
// button fires, the right button thrusts and the middle button self-destructs.
// Between waves the wheel browses upgrades and a left click takes one.
// toWorld maps a screen pixel to game coordinates (the camera is tilted).
export class MouseShipController {
  constructor(mouse, toWorld) {
    this.mouse = mouse;
    this.toWorld = toWorld;
  }

  read(ship) {
    const { mouse } = this;
    return {
      thrust: mouse.isDown(MOUSE.right),
      turn: ship && mouse.moved ? this.#aim(ship) : 0,
      fire: mouse.isDown(MOUSE.left),
    };
  }

  #aim(ship) {
    const p = this.toWorld(this.mouse.x, this.mouse.y);
    const dx = p.x - ship.x, dy = p.y - ship.y;
    if (Math.hypot(dx, dy) < DEAD_ZONE) return 0;
    const diff = wrapAngle(Math.atan2(dy, dx) - ship.angle);
    return Math.max(-1, Math.min(1, diff * AIM_GAIN));
  }

  stepPressed() { return this.mouse.wheelStep(); }
  selfDestructPressed() { return this.mouse.wasPressed(MOUSE.middle); }
  confirmPressed() { return this.mouse.wasPressed(MOUSE.left); }
}
