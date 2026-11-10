// Composition root: creates every object and wires them together.
// This is the only file that knows the concrete classes of everything.
import { PLAYERS, MENU_KEYS, TEST_KEYS, SCENERY } from './config.js';
import { EventBus, EVENTS } from './core/EventBus.js';
import { Viewport } from './core/Viewport.js';
import { ActivityMonitor } from './core/ActivityMonitor.js';
import { GameLoop } from './core/GameLoop.js';
import { StateMachine } from './core/StateMachine.js';
import { KeyboardInput } from './input/KeyboardInput.js';
import { KeyboardShipController } from './input/KeyboardShipController.js';
import { MouseInput } from './input/MouseInput.js';
import { MouseShipController } from './input/MouseShipController.js';
import { PlayerController } from './input/PlayerController.js';
import { ComputerShipController } from './input/ComputerShipController.js';
import { TestControls } from './input/TestControls.js';
import { VoiceCommands } from './input/VoiceCommands.js';
import { TouchControls } from './input/TouchControls.js';
import { SynthAudio } from './audio/SynthAudio.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { MusicPlayer } from './audio/MusicPlayer.js';
import { World } from './world/World.js';
import { Session } from './game/Session.js';
import { HighScores } from './game/HighScores.js';
import { ShipSystem } from './systems/ShipSystem.js';
import { BulletSystem } from './systems/BulletSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { BossSystem } from './systems/BossSystem.js';
import { SpawnPlanner } from './systems/SpawnPlanner.js';
import { WaveSpawner } from './systems/WaveSpawner.js';
import { ScoreKeeper } from './systems/ScoreKeeper.js';
import { Paymaster } from './systems/Paymaster.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { SelfDestructSystem } from './systems/SelfDestructSystem.js';
import { PickupSystem } from './systems/PickupSystem.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { EffectsDirector } from './effects/EffectsDirector.js';
import { LobbyState } from './states/LobbyState.js';
import { PlayState } from './states/PlayState.js';
import { PausedState } from './states/PausedState.js';
import { GameOverState } from './states/GameOverState.js';
import { ShopState } from './states/ShopState.js';
import { FlyoverState } from './states/FlyoverState.js';
import { Shop } from './upgrades/Shop.js';
import { WorldRenderer } from './render/three/WorldRenderer.js';
import { Overlay2D } from './render/overlay/Overlay2D.js';
import { OverlayRenderer } from './render/overlay/OverlayRenderer.js';
import { LobbyView } from './render/overlay/views/LobbyView.js';
import { HudView } from './render/overlay/views/HudView.js';
import { BannerView } from './render/overlay/views/BannerView.js';
import { PauseView } from './render/overlay/views/PauseView.js';
import { GameOverView } from './render/overlay/views/GameOverView.js';
import { ShopView } from './render/overlay/views/ShopView.js';
import { FlashView } from './render/overlay/views/FlashView.js';
import { FireworksView } from './render/overlay/views/FireworksView.js';
import { DemoView } from './render/overlay/views/DemoView.js';
import { CreditsView } from './render/overlay/views/CreditsView.js';
import { Fireworks } from './effects/Fireworks.js';

// --- infrastructure ---
const bus = new EventBus();
const viewport = new Viewport(window);
const activity = new ActivityMonitor(window);
const capturedKeys = [...PLAYERS.flatMap(p => Object.values(p.keys)), MENU_KEYS.start, MENU_KEYS.switchMode, 'Space', 'Backspace'];
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
const computers = PLAYERS.map(() => new ComputerShipController(world, () => session.mode, () => session.cpuSkill));
const session = new Session(bus, controllers, undefined, computers);
// a phone has one pilot: start the lobby with only P1 joined
if (TouchControls.likelyTouch()) session.joined = session.joined.map((_, i) => i === 0);
const waves = new WaveSpawner(bus);
const shop = new Shop();
const highScores = new HighScores();
const particles = new ParticleSystem();
const effects = new EffectsDirector(bus, particles);
const fireworks = new Fireworks(bus, viewport);
new ScoreKeeper(bus);
new Paymaster(bus);
const systems = {
  ships: new ShipSystem(bus, new SpawnPlanner()),
  bullets: new BulletSystem(),
  enemies: new EnemySystem(bus),
  boss: new BossSystem(bus),
  collisions: new CollisionSystem(bus),
  selfDestruct: new SelfDestructSystem(bus),
  pickups: new PickupSystem(bus, world),
};

// --- states ---
const states = new StateMachine();
const deps = { input, bus, world, session, waves, effects, states, systems, shop, activity, highScores };
states
  .register('lobby', new LobbyState(deps))
  .register('playing', new PlayState(deps))
  .register('paused', new PausedState(deps))
  .register('shop', new ShopState(deps))
  .register('flyover', new FlyoverState(deps))
  .register('gameover', new GameOverState(deps));
const testControls = new TestControls(deps);

// say "nåt coolt" into the microphone to fly straight to the arctic level,
// "fuska" to make the players invincible, "engage" to hold every human
// pilot's thrusters on and "stop" to hand them back to the keys
const setAutoThrust = on => {
  if (states.currentName !== 'playing') return;
  if (controllers.every(c => c.autoThrust === on)) return;
  for (const c of controllers) c.autoThrust = on;
  session.announce(on ? 'THRUSTERS ENGAGED' : 'THRUSTERS OFF', 1.5);
};
const voice = new VoiceCommands({ lang: 'sv-SE' })
  .on(/fuska/, () => testControls.makeInvincible())
  // the Swedish recogniser may spell the English word a few ways
  .on(/\b(engage|engag|in\s?gage|en\s?gage|ingage|engej|ingej)/, () => setAutoThrust(true))
  .on(/\bstopp?\b/, () => setAutoThrust(false))
  .on(/n[åoa]t+\s*coo?l+t/, () => {
    const arcticWave = SCENERY.findIndex(s => s.key === 'arctic') + 1;
    testControls.goToWave(arcticWave);   // its wave banner names the arctic
  });
input.onKeyDown(() => voice.start());
mouse.onButtonDown(() => voice.start());

// --- presentation ---
const worldRenderer = new WorldRenderer({
  canvas: document.getElementById('gl'), viewport, bus, world, particles, session, states,
});
const hud = new HudView();
const flash = new FlashView(bus);
const fireworksView = new FireworksView(fireworks);
const demoView = new DemoView();
const overlay = new OverlayRenderer(
  new Overlay2D(document.getElementById('hud'), viewport), states, { world, session, waves, audio, shop, highScores })
  .register('lobby', [new LobbyView()])
  .register('playing', [fireworksView, hud, new BannerView(), flash, demoView])
  .register('paused', [hud, new PauseView()])
  .register('shop', [flash, hud, new ShopView(), demoView])
  .register('flyover', [fireworksView, new CreditsView()])
  .register('gameover', [fireworksView, flash, hud, new GameOverView(), demoView]);
const footer = document.getElementById('foot');
const touch = new TouchControls({ input, states, players: PLAYERS, onGesture: () => { audio.unlock(); voice.start(); } });
overlay.context.touch = touch;
overlay.context.cameraView = () => worldRenderer.view;

// --- run ---
states.change('lobby');
new GameLoop({
  update(dt) {
    if (session.demo && input.wasPressed(MENU_KEYS.exitDemo)) {
      // only Esc ends the demo; that press is used up here
      bus.emit(EVENTS.MENU_ACTION);
      states.change('lobby');
    } else {
      if (input.wasPressed(MENU_KEYS.mute)) audio.toggleMute();
      if (input.wasPressed(MENU_KEYS.firstPerson)) {
        const view = worldRenderer.cycleView();
        if (states.currentName !== 'lobby') session.announce({ overview: 'OVERVIEW', cockpit: 'COCKPIT VIEW', chase: 'CHASE VIEW' }[view], 1.2);
        bus.emit(EVENTS.MENU_ACTION);
      }
      testControls.update();
      states.update(dt);
    }
    // the victory fireworks run from the final boss's fall until the players leave the results
    fireworks.update(dt, session.victory && ['playing', 'flyover', 'gameover'].includes(states.currentName));
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
// game.addMoney(500) gives every pilot $500; game.addMoney(500, 0) only P1
window.game = { states, world, session, bus, waves, shop, fireworks, systems, highScores, addMoney: (amount, player) => testControls.addMoney(amount, player) };
