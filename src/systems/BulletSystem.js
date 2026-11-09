export class BulletSystem {
  update(dt, world) {
    for (const b of world.bullets) b.update(dt, world.bounds);
  }

  removeSpent(world) {
    world.bullets = world.bullets.filter(b => !b.dead);
  }
}
