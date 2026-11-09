# team-6
Vibe Jam 2026 – lag 6

## Mach Mania

A local multiplayer fighter-jet shooter for 2 players sharing one keyboard.
Scramble your low-poly Saab JAS 39 Gripen E, go full throttle, and fire rockets at
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

- **Weapons:** every jet carries four guns and the switch-weapon key cycles through them
  (the HUD lists them all under your lives and boxes the active one). **Rockets** are the all-rounder, the
  **Blaster** fires fast, small, short-range bolts, **Scatter** is a slow five-shot
  shotgun blast and **Homing** fires slow, heavy missiles that lock on to the nearest enemy
  ahead (in free-for-all also other jets) and take 3 hits off the boss. Upgrades such as Rapid Fire or Spread Shot boost every weapon.

- **Flying solo:** with only one pilot joined, **Space** fires too (and buys in the shop between waves).
- **Mouse control:** in the lobby, **C** hands the mouse to nobody → P1 → P2. That pilot's jet turns its
  nose towards the pointer, the **left button** fires, the **right button** thrusts, the **wheel**
  switches weapon and the **middle button** self-destructs; between waves the **wheel** browses the shop and a **left click** buys.
  Their keys keep working too, so e.g. P1 can fly with WASD while P2 uses the mouse.
- **Computer pilot:** in the lobby, **V** hands P2 to the computer (and joins it), and **V** again
  takes it back. It dodges rocks, the boss and its bullets, leads its shots, hunts the nearest
  target (including you in free-for-all), switches to the weapon that suits the range and spends its own money in the shop between waves. Its HUD
  name reads *P2 CPU*. With P1 as the only human, **Space** fires too.
- **Lobby:** press a player's fire key to join/leave, **Tab** switches mode, **C** picks who uses the mouse,
  **V** lets the computer fly P2, **X** starts a demo, **Enter** starts.
- **Demo mode:** **X** in the lobby (or 30 seconds without touching anything there) starts a match
  where the computer flies both jets, in the mode picked in the lobby. When a demo match ends the results
  show for a few seconds and the next one starts. Only **Esc** ends the demo (other keys, clicks and
  taps don't) and puts the lobby back the way it was.
- **Modes:** *Free-for-all* (rockets hit other jets, 250 pts per kill, last ship flying wins)
  or *Co-op* (no friendly fire, fight through to the final boss together).
- **In game:** **P**/**Esc** pause (Q in pause quits to lobby), **M** mutes sound and music.
- **Waves:** there are **10 levels**. Normal waves last **1 minute**: a wave opens with a group of
  enemies and more keep arriving from the edges (more often and in bigger groups each wave); the
  HUD shows the clock. When time is up the survivors retreat and the shop opens. **Wave 5** is a
  boss fight (beat it and the shop opens), and **wave 10** is the final boss, the **Mothership** —
  beat it and the game ends in **VICTORY**, with fireworks.
- **Enemies** come in three types that spawn on their own (nothing splits when shot); later
  waves bring more planes and zeppelins:

  | Enemy | Behaviour | Hits | Score | Money |
  |-------|-----------|------|-------|-------|
  | Drone | flies straight ahead | 1 | 50 | $5 |
  | Plane | turns towards the nearest jet and fires at it | 2 | 100 | $15 |
  | Zeppelin | drifts slowly and launches drones at you (up to 3 of its own at a time) | 5 | 200 | $30 |

  Plane bullets, like the boss's, fly through the other enemies. Flying into an enemy costs
  your jet and counts as one hit on it. Shooting down another jet in free-for-all pays $50 and
  every hit on the boss $2. Each pilot's money is shown in gold next to their score. Extra life
  every 10 000 points.
- The landscape below changes every wave:

  | Wave | Landscape |
  |------|-----------|
  | 1 | Swedish forest of pines, lakes and red cottages |
  | 2 | a harbour city along a rocky coastline |
  | 3 | the snowy Alps |
  | 4 | a high-fantasy realm (red-rock warlands with war camps and a glowing portal, an enchanted violet forest with mana crystals and a keep; the enemies become flapping fish-folk raiders) |
  | 5 | back over the Swedish forest for the first boss |
  | 6 | Sahara dunes with the pyramids and a palm oasis |
  | 7 | volcanic isles of black basalt in a glowing lava sea, a volcano smouldering on the horizon |
  | 8 | arctic pack ice: cracked floes, icebergs and a red research station |
  | 9 | a neon city at night: dark towers, glowing rooftops and streets traced in light |
  | 10 | the Moon: grey craters under a black sky and a small moon base |
- **Shaky camera:** every 9–18 seconds of play the camera swings to a random new 3D angle
  around the arena (turned up to ~35° either way, from almost straight down to a low, steep view),
  always refitted so the whole arena stays on screen. It settles back to the normal view in the lobby.
- **Boss fight (wave 5):** it warps in, drifts around the arena and fires rings, aimed fans and
  spirals; below half health it gets faster and angrier. Its bullets hit everyone and fly through
  the other enemies, and ramming it is fatal. 10 points per hit, 3 000 for the final blow.
- **Final boss (wave 10): the Mothership.** A huge saucer carrier with a **shield arc** that sweeps
  around its hull and blocks shots from that side (aim for the open side, where the hangar is). It
  launches **fighters** from the hangar, sends **walls of bullets** across the arena with a gap to
  slip through, and fires slow, heavy **cannon shells** at every jet; below half health it spins
  its shield faster and adds counter-rotating spirals. 15 points per hit, 10 000 for the final
  blow — which wins the game: **VICTORY** banner, fanfare and fireworks over the arena, then a gold
  victory screen with the fireworks still going.
- **Self-destruct:** blows your jet up in a massive blast that wipes out every enemy, bullet,
  jet and the boss, shields or not, and **ends the game**. You still score everything the
  blast takes out (and, in free-for-all, every kill) before the final scores are shown.
- **Shop:** between waves every pilot still in the game gets their own column in the shop with
  the whole catalog. Browse with your turn keys, buy the highlighted upgrade with your fire key
  (as many as you can afford), then pick **READY** at the bottom; the next wave starts once
  everyone is ready. Each level costs more than the last:

  | Upgrade | Effect | Max | Price of level 1 → each next level |
  |---------|--------|-----|------|
  | Rapid Fire | fire rate +25% | 4 | $150, ×1.6 |
  | Afterburner | thrust +20%, top speed +12% | 4 | $120, ×1.6 |
  | Gyro Thrusters | turn speed +20% | 3 | $100, ×1.6 |
  | Big Magazine | +2 shots in the air | 3 | $120, ×1.6 |
  | Rail Rounds | shot speed +20%, range +15% | 3 | $140, ×1.6 |
  | Spread Shot | +1 bullet per shot | 2 | $400, ×1.8 |
  | Deflector | blocks one hit per wave (faint bubble while charged) | 2 | $300, ×1.8 |
  | Spare Ship | +1 life | – | $250, ×1.3 |

### Testing shortcuts

| Key | Effect |
|-----|--------|
| **G** | toggle invincible mode (lobby or in game) – ships can't be destroyed |
| **1–9**, **0** | jump to wave 1–9 / 10 (from the lobby: start the match at that wave) |
| **N** | skip to the next wave (hint shown only while invincible) |
| **B** | jump to the next boss wave: 5, then the Mothership on 10 (from the lobby: start at the first boss; hint shown only while invincible) |
| **K** | give every pilot **$1000** (in game or in the shop) |

From the browser console, `game.addMoney(500)` gives every pilot $500 and
`game.addMoney(500, 0)` gives it to P1 only (1 = P2).

Jumping clears the field (enemies, boss and its bullets) and starts the chosen wave at once.

**Touch screens:** on a phone or tablet, on-screen controls appear after the first
touch. ◀ ▶ turn, ▲ thrusts, ● fires, ⇄ switches weapon and ✸ self-destructs (they fly P1). In the lobby, tap P1's card
to join or leave, tap P2's card to add or remove a computer pilot, tap the mode line to switch mode and the start line to start. Between
waves, ◀ ▶ browse the shop and ● buys. In
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
                          ComputerShipController (computer pilot: dodges, leads shots, shops),
                          TestControls (invincible mode, wave jumps, dev money),
                          TouchControls (on-screen buttons that press the same key codes)
  audio/                  SynthAudio (WebAudio synth), SoundEffects (events -> sounds),
                          MusicPlayer (procedural soundtrack per game state)
  world/                  World (entities + destruction) and entities/ Ship, Asteroid, Bullet, Boss, Mothership
  systems/                ShipSystem, BulletSystem, EnemySystem (planes shoot, zeppelins launch drones),
                          BossSystem, CollisionSystem, WaveSpawner,
                          SpawnPlanner, ScoreKeeper, Paymaster (money), SelfDestructSystem
  modes/                  GameMode base class, FreeForAllMode, CoopMode
  game/Session.js         lobby choices, wave banner and final result
  upgrades/               catalog (every upgrade, its effect and price), Shop (prices, buying, ready)
  states/                 LobbyState, PlayState, PausedState, ShopState, GameOverState
  effects/                ParticleSystem (data), EffectsDirector (events -> particles), Fireworks (victory show)
  render/three/           3D world: ThreeStage, CameraRig, ArenaView, Lighting,
                          EntityViewSync + views/ (ShipView, AsteroidView, BulletView, BossView, MothershipView, ParticleView)
                          + scenery/ (Scenery, terrain helpers, noise, one file per landscape theme)
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
