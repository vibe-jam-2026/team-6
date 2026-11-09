# team-6
Vibe Jam 2026 – lag 6

## Mach Schnell

A local multiplayer fighter-jet shooter for 2 players sharing one keyboard.
Scramble your low-poly Saab JAS 39 Gripen E, go *schnell*, and fire rockets at
waves of enemy zeppelins, fighters and drones (large / medium / small targets),
then at bosses. Fly with your wingman in co-op, or fight them in free-for-all.
It is a static site with no server: `index.html` plus a vendored copy of
[Three.js](https://threejs.org) r170 (MIT) in `vendor/three/` for the 3D graphics
(tilted camera, lit low-poly aircraft and scenery, shadows, bloom glow). Play it at
https://vibe-jam-2026.github.io/team-6/.

To run it locally, serve the folder over HTTP (ES modules don't load from `file://`):

```bash
python3 -m http.server 8000
```

then open http://localhost:8000.

| Player | Thrust | Turn | Fire | Switch weapon | Self-destruct |
|--------|--------|------|------|---------------|---------------|
| P1 (red)    | W       | A / D       | S       | Q             | E             |
| P2 (blue)   | ↑       | ← / →       | ↓       | /             | Right Shift   |

- **Weapons:** every jet carries three guns and the switch-weapon key cycles through them
  (the HUD lists all three under your lives and boxes the active one). **Rockets** are the all-rounder, the
  **Blaster** fires fast, small, short-range bolts and **Scatter** is a slow five-shot
  shotgun blast. Upgrades such as Rapid Fire or Spread Shot boost every weapon.

- **Flying solo:** with only one pilot joined, **Space** fires too (and takes an upgrade between waves).
- **Mouse control:** in the lobby, **C** hands the mouse to nobody → P1 → P2. That pilot's jet turns its
  nose towards the pointer, the **left button** fires, the **right button** thrusts, the **wheel**
  switches weapon and the **middle button** self-destructs; between waves the **wheel** browses upgrades and a **left click** takes one.
  Their keys keep working too, so e.g. P1 can fly with WASD while P2 uses the mouse.
- **Computer pilot:** in the lobby, **V** hands P2 to the computer (and joins it), and **V** again
  takes it back. It dodges rocks, the boss and its bullets, leads its shots, hunts the nearest
  target (including you in free-for-all), switches to the weapon that suits the range and takes its own upgrades between waves. Its HUD
  name reads *P2 CPU*. With P1 as the only human, **Space** fires too.
- **Lobby:** press a player's fire key to join/leave, **Tab** switches mode, **C** picks who uses the mouse,
  **V** lets the computer fly P2, **Enter** starts.
- **Modes:** *Free-for-all* (rockets hit other jets, 250 pts per kill, last ship flying wins)
  or *Co-op* (no friendly fire, survive as many waves as you can).
- **In game:** **P**/**Esc** pause (Q in pause quits to lobby), **M** mutes sound and music.
- Zeppelins, fighters and drones score 20 / 50 / 100; extra life every 10 000 points.
- The landscape below changes every wave: a Swedish forest of pines, lakes and red
  cottages, a harbour city along a rocky coastline, the snowy Alps, then a high-fantasy
  realm (red-rock warlands with spiked war camps and a glowing portal, and an
  enchanted violet forest with mana crystals and a blue-roofed keep, where the zeppelins,
  fighters and drones are replaced by flapping fish-folk raiders), and round again.
- **Boss fight:** after wave 4 comes a boss (and again every 5th wave, a bit tougher each time).
  It warps in, drifts around the arena and fires rings, aimed fans and spirals; below half
  health it gets faster and angrier. Its bullets hit everyone and fly through the other enemies, and ramming
  it is fatal. 10 points per hit, 3 000 for the final blow.
- **Self-destruct:** blows your jet up in a massive blast that wipes out every enemy, bullet,
  jet and the boss, shields or not, and **ends the game**. You still score everything the
  blast takes out (and, in free-for-all, every kill) before the final scores are shown.
- **Upgrades:** after each cleared wave, every player still in the game is offered three
  random upgrades. Browse with your turn keys and take one with your fire key; the next
  wave starts once everyone has picked. Upgrades stack up to a level cap:

  | Upgrade | Effect | Max |
  |---------|--------|-----|
  | Rapid Fire | fire rate +25% | 4 |
  | Afterburner | thrust +20%, top speed +12% | 4 |
  | Gyro Thrusters | turn speed +20% | 3 |
  | Big Magazine | +2 shots in the air | 3 |
  | Rail Rounds | shot speed +20%, range +15% | 3 |
  | Spread Shot | +1 bullet per shot | 2 |
  | Deflector | blocks one hit per wave (faint bubble while charged) | 2 |
  | Spare Ship | +1 life | – |

### Testing shortcuts

| Key | Effect |
|-----|--------|
| **G** | toggle invincible mode (lobby or in game) – ships can't be destroyed |
| **1–9**, **0** | jump to wave 1–9 / 10 (from the lobby: start the match at that wave) |
| **N** | skip to the next wave (hint shown only while invincible) |
| **B** | jump to the next boss wave (from the lobby: start at the first boss; hint shown only while invincible) |

Jumping clears the field (enemies, boss and its bullets) and starts the chosen wave at once.

**Touch screens:** on a phone or tablet, on-screen controls appear after the first
touch. ◀ ▶ turn, ▲ thrusts, ● fires, ⇄ switches weapon and ✸ self-destructs (they fly P1). In the lobby, tap P1's card
to join or leave, tap P2's card to add or remove a computer pilot, tap the mode line to switch mode and the start line to start. Between
waves, ◀ ▶ browse the upgrades and ● takes one. In
game there are pause and sound buttons at the bottom; on the game-over screen, tap
anywhere to go back to the lobby. Add `?touch=1` to the URL to force the controls on
(for example with a mouse), or `?touch=0` to keep them off.

## Code structure

`index.html` only holds the two canvases and loads `src/main.js`. The code is
split into small ES modules with one job each, following SOLID:

```
src/
  main.js                 composition root: builds every object and wires them together
  config.js               all tunable data (players, keys, physics, rules) – no behaviour
  core/                   EventBus, GameLoop (fixed timestep), StateMachine, Viewport, math
  input/                  KeyboardInput (raw keys), KeyboardShipController (keys -> intent),
                          MouseInput / MouseShipController (pointer aim, buttons -> intent),
                          PlayerController (a player's keys plus the mouse if it is theirs),
                          ComputerShipController (computer pilot: dodges, leads shots, picks upgrades),
                          TestControls (invincible mode and wave jumps),
                          TouchControls (on-screen buttons that press the same key codes)
  audio/                  SynthAudio (WebAudio synth), SoundEffects (events -> sounds),
                          MusicPlayer (procedural soundtrack per game state)
  world/                  World (entities + destruction) and entities/ Ship, Asteroid, Bullet, Boss
  systems/                ShipSystem, BulletSystem, BossSystem, CollisionSystem, WaveSpawner,
                          SpawnPlanner, ScoreKeeper, SelfDestructSystem
  modes/                  GameMode base class, FreeForAllMode, CoopMode
  game/Session.js         lobby choices, wave banner and final result
  upgrades/               catalog (every upgrade and its effect), UpgradeDraft (deal + pick)
  states/                 LobbyState, PlayState, PausedState, UpgradeState, GameOverState
  effects/                ParticleSystem (data) and EffectsDirector (events -> particles)
  render/three/           3D world: ThreeStage, CameraRig, ArenaView, Lighting,
                          EntityViewSync + views/ (ShipView, AsteroidView, BulletView, BossView, ParticleView)
                          + scenery/ (Scenery, terrain helpers, noise, forest / coast / alps themes)
  render/overlay/         2D HUD and menus: Overlay2D primitives, OverlayRenderer, views/
```

How the SOLID principles show up:

- **Single responsibility** – simulation, scoring, sound, particles, 3D and 2D drawing
  live in separate classes. Renderers only read game state.
- **Open/closed** – add an upgrade by appending it to `upgrades/catalog.js`; add a game mode by subclassing `GameMode` and listing it in
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
