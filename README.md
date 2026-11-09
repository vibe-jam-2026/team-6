# team-6
Vibe Jam 2026 – lag 6

## Mach Schnell

A local multiplayer fighter-jet shooter for up to 4 players sharing one keyboard.
Scramble your low-poly Saab JAS 39 Gripen E, go *schnell*, and fire rockets at
waves of enemy bombers, fighters and birds (large / medium / small targets),
then at bosses. Fly with your wingmen in co-op, or fight them in free-for-all.
It is a static site with no server: `index.html` plus a vendored copy of
[Three.js](https://threejs.org) r170 (MIT) in `vendor/three/` for the 3D graphics
(tilted camera, lit low-poly aircraft and scenery, shadows, bloom glow). Play it at
https://vibe-jam-2026.github.io/team-6/.

To run it locally, serve the folder over HTTP (ES modules don't load from `file://`):

```bash
python3 -m http.server 8000
```

then open http://localhost:8000.

| Player | Thrust | Turn | Fire |
|--------|--------|------|------|
| P1 (red)    | W       | A / D       | S       |
| P2 (blue)   | ↑       | ← / →       | ↓       |
| P3 (green)  | I       | J / L       | K       |
| P4 (yellow) | Num 8   | Num 4 / 6   | Num 5   |

- **Lobby:** press a player's fire key to join/leave, **Tab** switches mode, **Enter** starts.
- **Modes:** *Free-for-all* (rockets hit other jets, 250 pts per kill, last ship flying wins)
  or *Co-op* (no friendly fire, survive as many waves as you can).
- **In game:** **P**/**Esc** pause (Q in pause quits to lobby), **M** mutes sound and music.
- Bombers, fighters and birds score 20 / 50 / 100; extra life every 10 000 points.
- The landscape below changes every wave: a Swedish forest of pines, lakes and red
  cottages, a harbour city along a rocky coastline, then the snowy Alps, and round again.
- **Boss fight:** after wave 4 comes a boss (and again every 5th wave, a bit tougher each time).
  It warps in, drifts around the arena and fires rings, aimed fans and spirals; below half
  health it gets faster and angrier. Its bullets hit everyone and fly through the other enemies, and ramming
  it is fatal. 10 points per hit, 3 000 for the final blow.

### Testing shortcuts

| Key | Effect |
|-----|--------|
| **G** | toggle invincible mode (lobby or in game) – ships can't be destroyed |
| **1–9**, **0** | jump to wave 1–9 / 10 (from the lobby: start the match at that wave) |
| **N** | skip to the next wave (hint shown only while invincible) |
| **B** | jump to the next boss wave (from the lobby: start at the first boss; hint shown only while invincible) |

Jumping clears the field (rocks, boss and its bullets) and starts the chosen wave at once.

**Touch screens:** on a phone or tablet, on-screen controls appear after the first
touch. ◀ ▶ turn, ▲ thrusts and ● fires (they fly P1). In the lobby, tap a pilot's card
to join or leave, tap the mode line to switch mode and the start line to start. In
game there are pause and sound buttons at the bottom; on the game-over screen, tap
anywhere to go back to the lobby. Add `?touch=1` to the URL to force the controls on
(for example with a mouse), or `?touch=0` to keep them off.

Note: some keyboards can't register many simultaneous keys ("ghosting"), so with
4 players on one keyboard a few key combinations may drop out.

## Code structure

`index.html` only holds the two canvases and loads `src/main.js`. The code is
split into small ES modules with one job each, following SOLID:

```
src/
  main.js                 composition root: builds every object and wires them together
  config.js               all tunable data (players, keys, physics, rules) – no behaviour
  core/                   EventBus, GameLoop (fixed timestep), StateMachine, Viewport, math
  input/                  KeyboardInput (raw keys), KeyboardShipController (keys -> intent),
                          TestControls (invincible mode and wave jumps),
                          TouchControls (on-screen buttons that press the same key codes)
  audio/                  SynthAudio (WebAudio synth), SoundEffects (events -> sounds),
                          MusicPlayer (procedural soundtrack per game state)
  world/                  World (entities + destruction) and entities/ Ship, Asteroid, Bullet, Boss
  systems/                ShipSystem, BulletSystem, BossSystem, CollisionSystem, WaveSpawner,
                          SpawnPlanner, ScoreKeeper
  modes/                  GameMode base class, FreeForAllMode, CoopMode
  game/Session.js         lobby choices, wave banner and final result
  states/                 LobbyState, PlayState, PausedState, GameOverState
  effects/                ParticleSystem (data) and EffectsDirector (events -> particles)
  render/three/           3D world: ThreeStage, CameraRig, ArenaView, Lighting,
                          EntityViewSync + views/ (ShipView, AsteroidView, BulletView, BossView, ParticleView)
                          + scenery/ (Scenery, terrain helpers, noise, forest / coast / alps themes)
  render/overlay/         2D HUD and menus: Overlay2D primitives, OverlayRenderer, views/
```

How the SOLID principles show up:

- **Single responsibility** – simulation, scoring, sound, particles, 3D and 2D drawing
  live in separate classes. Renderers only read game state.
- **Open/closed** – add a game mode by subclassing `GameMode` and listing it in
  `modes/index.js`; add a screen by registering a view in `main.js`; add an entity type
  with a new `EntityViewSync`. Existing classes don't change.
- **Liskov substitution** – every `GameMode` answers the same questions
  (`friendlyFire`, `isOver`, `headline`, …) and can replace any other.
- **Interface segregation** – a ship only needs a controller with `read()`, a view
  only needs `draw(overlay, frame)`, a state only needs `update(dt)`.
- **Dependency inversion** – gameplay announces events on the `EventBus`
  (`shipDestroyed`, `shotFired`, …); sound, effects, scoring and camera shake
  subscribe to them, and `main.js` is the only place that knows concrete classes.
  Swapping keyboard control for a gamepad means writing one new controller class.
