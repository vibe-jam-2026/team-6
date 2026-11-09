// Composition root: creates every object and wires them together.
// This is the only file that knows the concrete classes of everything.
import { PLAYERS, MENU_KEYS, TEST_KEYS } from './config.js';
import { EventBus } from './core/EventBus.js';
import { Viewport } from './core/Viewport.js';
import { GameLoop } from './core/GameLoop.js';
import { StateMachine } from './core/StateMachine.js';
import { KeyboardInput } from './input/KeyboardInput.js';
import { KeyboardShipController } from './input/KeyboardShipController.js';
import { MouseInput } from './input/MouseInput.js';
import { MouseShipController } from './input/MouseShipController.js';
import { PlayerController } from './input/PlayerController.js';
import { ComputerShipController } from './input/ComputerShipController.js';
import { TestControls } from './input/TestControls.js';
import { TouchControls } from './input/TouchControls.js';
import { SynthAudio } from './audio/SynthAudio.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { MusicPlayer } from './audio/MusicPlayer.js';
import { World } from './world/World.js';
import { Session } from './game/Session.js';
import { ShipSystem } from './systems/ShipSystem.js';
import { BulletSystem } from './systems/BulletSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { BossSystem } from './systems/BossSystem.js';
import { SpawnPlanner } from './systems/SpawnPlanner.js';
import { WaveSpawner } from './systems/WaveSpawner.js';
import { ScoreKeeper } from './systems/ScoreKeeper.js';
import { SelfDestructSystem } from './systems/SelfDestructSystem.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { EffectsDirector } from './effects/EffectsDirector.js';
import { LobbyState } from './states/LobbyState.js';
import { PlayState } from './states/PlayState.js';
import { PausedState } from './states/PausedState.js';
import { GameOverState } from './states/GameOverState.js';
import { UpgradeState } from './states/UpgradeState.js';
import { UpgradeDraft } from './upgrades/UpgradeDraft.js';
import { WorldRenderer } from './render/three/WorldRenderer.js';
import { Overlay2D } from './render/overlay/Overlay2D.js';
import { OverlayRenderer } from './render/overlay/OverlayRenderer.js';
import { LobbyView } from './render/overlay/views/LobbyView.js';
import { HudView } from './render/overlay/views/HudView.js';
import { BannerView } from './render/overlay/views/BannerView.js';
import { PauseView } from './render/overlay/views/PauseView.js';
import { GameOverView } from './render/overlay/views/GameOverView.js';
import { UpgradeView } from './render/overlay/views/UpgradeView.js';
import { FlashView } from './render/overlay/views/FlashView.js';

// --- infrastructure ---
const bus = new EventBus();
const viewport = new Viewport(window);
const capturedKeys = [...PLAYERS.flatMap(p => Object.values(p.keys)), MENU_KEYS.start, MENU_KEYS.switchMode, 'Space'];
const input = new KeyboardInput(window, capturedKeys);
const audio = new SynthAudio();
input.onKeyDown(() => audio.unlock());
const mouse = new MouseInput(window);
mouse.onButtonDown(() => audio.unlock());
new SoundEffects(bus, audio);
const music = new MusicPlayer(audio, bus);

// --- game model ---
// screen pixel -> game coordinates, through the tilted 3D camera (ships fly a little above the plane)
const screenToWorld = (px, py) => {
  const p = worldRenderer.cameraRig.screenToPlane(px, py, 4);
  return { x: p.x + viewport.width / 2, y: viewport.height / 2 - p.y };
};
const mouseController = new MouseShipController(mouse, screenToWorld);
const controllers = PLAYERS.map(p => new PlayerController(new KeyboardShipController(input, p.keys), mouseController));
const world = new World(viewport, bus);
const computers = PLAYERS.map(() => new ComputerShipController(world, () => session.mode));
const session = new Session(bus, controllers, undefined, computers);
// a phone has one pilot: start the lobby with only P1 joined
if (TouchControls.likelyTouch()) session.joined = session.joined.map((_, i) => i === 0);
const waves = new WaveSpawner(bus);
const upgrades = new UpgradeDraft();
const particles = new ParticleSystem();
const effects = new EffectsDirector(bus, particles);
new ScoreKeeper(bus);
const systems = {
  ships: new ShipSystem(bus, new SpawnPlanner()),
  bullets: new BulletSystem(),
  boss: new BossSystem(bus),
  collisions: new CollisionSystem(bus),
  selfDestruct: new SelfDestructSystem(bus),
};

// --- states ---
const states = new StateMachine();
const deps = { input, bus, world, session, waves, effects, states, systems, upgrades };
states
  .register('lobby', new LobbyState(deps))
  .register('playing', new PlayState(deps))
  .register('paused', new PausedState(deps))
  .register('upgrade', new UpgradeState(deps))
  .register('gameover', new GameOverState(deps));
const testControls = new TestControls(deps);

// --- presentation ---
const worldRenderer = new WorldRenderer({
  canvas: document.getElementById('gl'), viewport, bus, world, particles, session, states,
});
const hud = new HudView();
const flash = new FlashView(bus);
const overlay = new OverlayRenderer(
  new Overlay2D(document.getElementById('hud'), viewport), states, { world, session, waves, audio, upgrades })
  .register('lobby', [new LobbyView()])
  .register('playing', [hud, new BannerView(), flash])
  .register('paused', [hud, new PauseView()])
  .register('upgrade', [flash, hud, new UpgradeView()])
  .register('gameover', [flash, hud, new GameOverView()]);
const footer = document.getElementById('foot');
const touch = new TouchControls({ input, states, players: PLAYERS, onGesture: () => audio.unlock() });
overlay.context.touch = touch;

// --- run ---
states.change('lobby');
new GameLoop({
  update(dt) {
    if (input.wasPressed(MENU_KEYS.mute)) audio.toggleMute();
    testControls.update();
    states.update(dt);
    music.setMood(states.currentName);
    music.tick();
    input.endStep();
    mouse.endStep();
  },
  render(time) {
    worldRenderer.render(time);
    overlay.render(time);
    touch.sync();
    footer.style.display = states.currentName === 'lobby' ? '' : 'none';
  },
}).start();

// handle for debugging from the browser console
window.game = { states, world, session, bus, waves };
