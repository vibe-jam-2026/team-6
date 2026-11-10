import { ThreeStage } from './ThreeStage.js';
import { Lighting } from './Lighting.js';
import { ArenaView } from './ArenaView.js';
import { CameraRig } from './CameraRig.js';
import { Scenery } from './scenery/Scenery.js';
import { SCENERY, sceneryForWave } from '../../config.js';
import { EVENTS } from '../../core/EventBus.js';
import { createGlowDotTexture } from './textures.js';
import { EntityViewSync } from './EntityViewSync.js';
import { WeatherView } from './WeatherView.js';
import { GroundTargetView } from './views/GroundTargetView.js';
import { ShipView } from './views/ShipView.js';
import { AsteroidView } from './views/AsteroidView.js';
import { BulletView } from './views/BulletView.js';
import { PickupView } from './views/PickupView.js';
import { BossView } from './views/BossView.js';
import { MothershipView } from './views/MothershipView.js';
import { ParticleView } from './views/ParticleView.js';
import { LobbyShowcase } from './LobbyShowcase.js';
import { BlastView } from './BlastView.js';
import { toSceneX, toSceneY } from './coords.js';

// Draws the game world in 3D. Reads game state; never changes it.
export class WorldRenderer {
  #lastTime = null;
  firstPerson = false;   // ride in P1's cockpit during a match (toggled with F)

  constructor({ canvas, viewport, bus, world, particles, session, states }) {
    Object.assign(this, { viewport, world, particles, session, states });
    this.stage = new ThreeStage(canvas);
    const { scene, camera } = this.stage;
    const dot = createGlowDotTexture();
    this.lighting = new Lighting(scene);
    this.arena = new ArenaView(scene);
    this.cameraRig = new CameraRig(camera, bus);
    this.scenery = new Scenery(scene, this.lighting, this.stage.bloom);
    this.wave = 1;
    bus.on(EVENTS.WAVE_STARTED, ({ wave }) => { this.wave = wave; });
    this.asteroidViews = new EntityViewSync(scene, a => new AsteroidView(a, this.sceneryKey));
    this.shipViews = new EntityViewSync(scene, s => new ShipView(s));
    this.groundViews = new EntityViewSync(scene, g => new GroundTargetView(g, (x, y) => this.scenery.groundAt(x, y)));
    this.bulletViews = new EntityViewSync(scene, b => new BulletView(b));
    this.pickupViews = new EntityViewSync(scene, p => new PickupView(p));
    this.bossViews = new EntityViewSync(scene, b => b.kind === 'mothership' ? new MothershipView(b) : new BossView(b));
    this.weather = new WeatherView(scene, dot);
    this.particleView = new ParticleView(dot);
    scene.add(this.particleView.object);
    this.lobby = new LobbyShowcase(scene, this.cameraRig);
    this.blasts = new BlastView(scene, bus);

    viewport.onResize(vp => {
      this.stage.resize(vp);
      this.arena.build(vp);
      this.lighting.fit(vp);
      this.cameraRig.fit(vp);
      this.scenery.fit(vp, this.stage.camera.position.length());
      this.weather.fit(vp);
    });
  }

  render(time) {
    const t = time / 1000;
    const dt = this.#lastTime === null ? 0 : Math.min(0.1, t - this.#lastTime);
    this.#lastTime = t;
    const inLobby = this.states.currentName === 'lobby';
    // the victory flyover tours every landscape; otherwise the wave's landscape
    this.sceneryKey = inLobby ? SCENERY[0].key : this.session.flyover?.key ?? sceneryForWave(this.wave).key;
    this.scenery.show(this.sceneryKey);
    this.weather.show(this.sceneryKey);
    this.weather.update(dt);
    // the cockpit view hides P1's own jet once the camera is nearly inside it
    const frame = { t, bounds: this.viewport, session: this.session, cockpit: this.cameraRig.firstPerson > 0.5 ? 0 : null };

    this.asteroidViews.sync(this.world.asteroids, frame);
    this.groundViews.sync(inLobby ? [] : this.world.groundTargets, frame);
    this.shipViews.sync(inLobby ? [] : this.world.ships, frame);
    this.bulletViews.sync(inLobby ? [] : this.world.bullets, frame);
    this.pickupViews.sync(inLobby ? [] : this.world.pickups, frame);
    this.bossViews.sync(!inLobby && this.world.boss ? [this.world.boss] : [], frame);
    this.particleView.update(this.particles.particles, this.viewport);
    this.blasts.update(t, this.viewport);
    const state = this.states.currentName;
    const flyover = state === 'flyover';
    this.cameraRig.update(dt, t, {
      drift: inLobby || flyover, spin: state === 'playing', frozen: !['playing', 'lobby', 'flyover'].includes(state),
      pilot: this.firstPerson && !inLobby && !flyover ? this.#pilot(t) : null,
    });
    this.scenery.setCameraDistance(this.cameraRig.distance);
    this.lobby.update(inLobby, frame);
    this.stage.render();
  }

  toggleFirstPerson() { this.firstPerson = !this.firstPerson; return this.firstPerson; }

  // P1's jet in scene space, at the height its view bobs at, or null while it is down
  #pilot(t) {
    const ship = this.world.ships.find(s => s.index === 0);
    if (!ship?.alive) return null;
    const b = this.viewport;
    return { x: toSceneX(b, ship.x), y: toSceneY(b, ship.y), z: 4 + Math.sin(t * 3 + ship.index) * 2, angle: ship.angle, bank: ship.bank };
  }
}
