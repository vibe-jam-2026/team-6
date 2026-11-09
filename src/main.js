// Composition root: creates every object and wires them together.
// This is the only file that knows the concrete classes of everything.
import { PLAYERS, MENU_KEYS } from './config.js';
import { EventBus } from './core/EventBus.js';
import { Viewport } from './core/Viewport.js';
import { GameLoop } from './core/GameLoop.js';
import { StateMachine } from './core/StateMachine.js';
import { KeyboardInput } from './input/KeyboardInput.js';
import { KeyboardShipController } from './input/KeyboardShipController.js';
import { SynthAudio } from './audio/SynthAudio.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { World } from './world/World.js';
import { Session } from './game/Session.js';
import { ShipSystem } from './systems/ShipSystem.js';
import { BulletSystem } from './systems/BulletSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { SpawnPlanner } from './systems/SpawnPlanner.js';
import { WaveSpawner } from './systems/WaveSpawner.js';
import { ScoreKeeper } from './systems/ScoreKeeper.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { EffectsDirector } from './effects/EffectsDirector.js';
import { LobbyState } from './states/LobbyState.js';
import { PlayState } from './states/PlayState.js';
import { PausedState } from './states/PausedState.js';
import { GameOverState } from './states/GameOverState.js';
import { WorldRenderer } from './render/three/WorldRenderer.js';
import { Overlay2D } from './render/overlay/Overlay2D.js';
import { OverlayRenderer } from './render/overlay/OverlayRenderer.js';
import { LobbyView } from './render/overlay/views/LobbyView.js';
import { HudView } from './render/overlay/views/HudView.js';
import { BannerView } from './render/overlay/views/BannerView.js';
import { PauseView } from './render/overlay/views/PauseView.js';
import { GameOverView } from './render/overlay/views/GameOverView.js';

// --- infrastructure ---
const bus = new EventBus();
const viewport = new Viewport(window);
const capturedKeys = [...PLAYERS.flatMap(p => Object.values(p.keys)), MENU_KEYS.start, MENU_KEYS.switchMode, 'Space'];
const input = new KeyboardInput(window, capturedKeys);
const audio = new SynthAudio();
input.onKeyDown(() => audio.unlock());
new SoundEffects(bus, audio);

// --- game model ---
const controllers = PLAYERS.map(p => new KeyboardShipController(input, p.keys));
const world = new World(viewport, bus);
const session = new Session(bus, controllers);
const waves = new WaveSpawner(bus);
const particles = new ParticleSystem();
const effects = new EffectsDirector(bus, particles);
new ScoreKeeper(bus);
const systems = {
  ships: new ShipSystem(bus, new SpawnPlanner()),
  bullets: new BulletSystem(),
  collisions: new CollisionSystem(bus),
};

// --- states ---
const states = new StateMachine();
const deps = { input, bus, world, session, waves, effects, states, systems };
states
  .register('lobby', new LobbyState(deps))
  .register('playing', new PlayState(deps))
  .register('paused', new PausedState(deps))
  .register('gameover', new GameOverState(deps));

// --- presentation ---
const worldRenderer = new WorldRenderer({
  canvas: document.getElementById('gl'), viewport, bus, world, particles, session, states,
});
const hud = new HudView();
const overlay = new OverlayRenderer(
  new Overlay2D(document.getElementById('hud'), viewport), states, { world, session, waves, audio })
  .register('lobby', [new LobbyView()])
  .register('playing', [hud, new BannerView()])
  .register('paused', [hud, new PauseView()])
  .register('gameover', [hud, new GameOverView()]);
const footer = document.getElementById('foot');

// --- run ---
states.change('lobby');
new GameLoop({
  update(dt) {
    if (input.wasPressed(MENU_KEYS.mute)) audio.toggleMute();
    states.update(dt);
    input.endStep();
  },
  render(time) {
    worldRenderer.render(time);
    overlay.render(time);
    footer.style.display = states.currentName === 'lobby' ? '' : 'none';
  },
}).start();

// handle for debugging from the browser console
window.game = { states, world, session, bus };
