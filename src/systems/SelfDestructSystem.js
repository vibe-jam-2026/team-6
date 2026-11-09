import { EVENTS } from '../core/EventBus.js';

// A pilot's last resort: their ship goes up in a blast that wipes out every
// rock, bullet and ship on screen (the boss too) and ends the match. Shields and spawn
// protection don't help. The pilot still scores the rocks, and in modes with
// friendly fire also the kills.
export class SelfDestructSystem {
  constructor(bus) {
    this.bus = bus;
  }

  update(world, mode) {
    const bomber = world.ships.find(s => s.alive && s.controller.selfDestructPressed());
    if (bomber) this.detonate(bomber, world, mode);
  }

  detonate(bomber, world, mode) {
    const { x, y } = bomber;
    world.destroyShip(bomber, null, { force: true, inBlast: true });
    for (const ship of world.ships) {
      if (ship.alive) world.destroyShip(ship, mode.friendlyFire ? bomber : null, { force: true, inBlast: true });
    }
    for (const rock of [...world.asteroids]) world.obliterateAsteroid(rock, bomber);
    world.obliterateBoss(bomber);
    world.bullets = [];
    for (const ship of world.ships) ship.eliminate(); // nobody respawns: game over
    // announced last, so the blast's big camera shake isn't overridden by the smaller ones
    this.bus.emit(EVENTS.SELF_DESTRUCT, { ship: bomber, x, y });
  }
}
