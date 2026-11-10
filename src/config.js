// All tunable data lives here. Nothing in this file has behaviour.

export const PLAYERS = [
  { name: 'P1', color: '#ff5d73', keys: { thrust: 'KeyW', left: 'KeyA', right: 'KeyD', fire: 'KeyS', selfDestruct: 'KeyE', weapon: 'KeyQ' },
    labels: ['W thrust', 'A/D turn', 'S fire', 'Q switch weapon', 'E self-destruct'] },
  { name: 'P2', color: '#4dd2ff', keys: { thrust: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', fire: 'ArrowDown', selfDestruct: 'ShiftRight', weapon: 'Slash' },
    labels: ['↑ thrust', '←/→ turn', '↓ fire', '/ switch weapon', 'R-Shift self-destruct'] },
];

// the player the lobby's computer key hands to the computer (P2)
export const COMPUTER_PLAYER = 1;

// How well the computer flies, picked in the lobby (it also flies the demo).
//   think: frames between decisions (it holds its last input in between)
//   aimError: radians its aim wanders either side of the perfect lead
//   lookahead / margin: how far ahead (s) and how wide (px) it watches for collisions
//   turnGain: how hard it steers per radian off course
//   roll: chance per second it barrel-rolls out of a hit it can't otherwise dodge
export const CPU_SKILLS = [
  { name: 'EASY', color: '#9dff5c', think: 14, aimError: 0.22, lookahead: 0.35, margin: 6, turnGain: 2.6, roll: 0 },
  { name: 'NORMAL', color: '#ffd23f', think: 5, aimError: 0.07, lookahead: 0.6, margin: 16, turnGain: 4, roll: 0.5 },
  { name: 'ACE', color: '#ff5d73', think: 1, aimError: 0, lookahead: 0.9, margin: 26, turnGain: 5, roll: 3 },
];
export const DEFAULT_CPU_SKILL = 1;

// card hints for a computer-flown jet
export const COMPUTER_LABELS = ['flown by the computer', 'V to hand it back'];

// card hints for whoever the lobby gives the mouse to (their keys still work too)
export const MOUSE_LABELS = ['mouse aims', 'right btn thrust', 'left btn fire', 'wheel switches weapon', 'middle btn self-destruct'];

export const MENU_KEYS = {
  start: 'Enter',
  switchMode: 'Tab',
  mute: 'KeyM',
  pause: ['KeyP', 'Escape'],
  quit: 'KeyQ',
  mouse: 'KeyC',     // lobby: hand the mouse to nobody / P1 / P2
  computer: 'KeyV',  // lobby: let the computer fly P2 (or hand it back)
  demo: 'KeyX',      // lobby: watch a demo where the computer flies both jets
  cpuSkill: 'KeyL',  // lobby: cycle the computer pilot's skill
  exitDemo: 'Escape', // the only key that ends a demo
};

// Demo mode: the computer flies every jet. It starts from the lobby with
// MENU_KEYS.demo or by itself after `idleTime` seconds without input, and only
// MENU_KEYS.exitDemo (Esc) ends it and goes back to the lobby.
export const DEMO = {
  idleTime: 30,       // seconds of lobby inactivity before the demo starts
  resultsTime: 7,     // seconds the results stay up before the next demo match
};

// Testing shortcuts: G toggles invincibility (lobby or in game),
// 1–5 jump straight to that wave (higher digits stop at the final wave),
// N skips to the next wave, B jumps to the boss, K gives every pilot money.
export const TEST_KEYS = {
  invincible: 'KeyG',
  addMoney: 'KeyK',
  nextWave: 'KeyN',
  nextBoss: 'KeyB',
  waves: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
};

export const SHIP = {
  turnSpeed: 4.4,        // rad/s
  thrust: 320,           // px/s^2
  drag: 0.55,            // velocity decay per second (exponential)
  maxSpeed: 440,
  radius: 13,
  fireCooldown: 0.17,
  maxBullets: 5,
  muzzleOffset: 15,
};

export const BULLET = { speed: 560, life: 0.95, radius: 2 };
export const SPREAD_ANGLE = 0.14; // radians between bullets of a spread shot

// The guns every jet carries; a pilot cycles through them with their weapon key.
// Each one scales the ship's own (upgradeable) gun stats, so upgrades help every weapon.
//   cooldown / speed / life: multipliers on fire cooldown, shot speed and range
//   shots: extra bullets per trigger pull, spread: multiplier on SPREAD_ANGLE
//   magazine: extra shots allowed in the air, size: visual scale of the rocket
//   homing (optional): turn rate in rad/s towards the nearest target ahead
//   damage (optional): boss hit points one shot takes off (default 1)
export const WEAPONS = [
  { id: 'rockets', name: 'ROCKETS', color: '#e8ecf4',
    cooldown: 1, speed: 1, life: 1, shots: 0, spread: 1, magazine: 0, size: 1 },
  { id: 'blaster', name: 'BLASTER', color: '#ffd23f',
    cooldown: 0.45, speed: 1.35, life: 0.7, shots: 0, spread: 1, magazine: 4, size: 0.7 },
  { id: 'scatter', name: 'SCATTER', color: '#9dff5c',
    cooldown: 2.1, speed: 0.9, life: 0.5, shots: 4, spread: 1.6, magazine: 8, size: 0.85 },
  { id: 'homing', name: 'HOMING', color: '#ff8a5c',
    cooldown: 2.8, speed: 0.6, life: 2.6, shots: 0, spread: 1, magazine: -2, size: 1.35,
    homing: 3.2, damage: 3 },
];

// how homing missiles pick a target: only things within this range and this
// angle either side of the missile's heading count
export const HOMING = { range: 520, cone: 1.4 };

// The three enemy types, keyed by size (the code still calls enemies
// "asteroids"). They no longer split: each type is spawned on its own.
//   hp: hits it takes; score: points; bounty: money for the pilot who destroys it
//   drone (1):    flies straight ahead
//   plane (2):    turns towards the nearest jet and fires at it
//   zeppelin (3): drifts slowly and launches drones
export const ENEMY_TYPES = {
  1: { kind: 'drone', radius: 13, speed: [95, 175], hp: 1, score: 50, bounty: 5, color: '#8fd0ff' },
  2: { kind: 'plane', radius: 25, speed: [115, 150], hp: 2, score: 100, bounty: 15, color: '#ff8a3a',
    turnRate: 1.5,             // rad/s it can turn towards its target
    fireEvery: [1.8, 3.2],     // seconds between shots
    fireRange: 430,            // only fires at jets this close...
    fireCone: 0.35,            // ...and within this many radians of its nose
    bullet: { speed: 300, life: 2.2, radius: 4 } },
  3: { kind: 'zeppelin', radius: 46, speed: [25, 45], hp: 5, score: 200, bounty: 30, color: '#ff4a3a',
    launchEvery: [3.5, 5.5],   // seconds between drone launches
    maxDrones: 3,              // drones of its own in the air at once
    launchSpread: 0.6 },       // radians either side of the nearest jet it aims drones
};

// Anti-aircraft guns on the ground below the arena, from wave 2 on (timed waves
// only). They swing towards the nearest jet and fire leading flak shots up at
// it; jets can't hit them by flying into them, only by shooting them.
//   count(wave): guns placed when the wave starts
export const GROUND = {
  count: wave => (wave < 2 ? 0 : Math.min(4, Math.floor((wave + 1) / 2))),
  radius: 20, hp: 3, score: 150, bounty: 20, color: '#ff4a3a',
  fireEvery: [2.6, 4.2],     // seconds between shots
  range: 480,                // only fires at jets this close
  bullet: { speed: 240, life: 2.4, radius: 4 },
  edgeMargin: 90,            // px kept clear of the arena edges
  spacing: 170,              // px between guns
  shipClearance: 180,        // px from any jet when placed
};

// how likely each type is when a wave spawns an enemy: [drone, plane, zeppelin] weights,
// sliding from the first wave to the last timed wave
export const ENEMY_MIX = { first: [6, 3, 1], last: [3, 4, 2] };

// The boss arrives on every `every`-th wave (wave 5, 10, ... - i.e. right after wave 4).
export const BOSS = {
  every: 5,             // must match WAVES.final: the boss is the final wave
  radius: 64,
  baseHp: 45,           // hit points for a single pilot...
  hpPerShip: 25,        // ...plus this per extra pilot
  hpGrowth: 0.5,        // each later boss gets 50 % more
  speed: 70,
  entryTime: 1.6,       // seconds it warps in, untouchable
  hitScore: 10,         // per bullet that lands
  hitBounty: 2,         // money per bullet that lands
  killScore: 3000,      // to the pilot landing the final blow
  bullet: { speed: 230, life: 3.2, radius: 5 },
  color: '#ff3b5c',
};

// The final boss on the last wave: a huge carrier that hides behind a
// rotating shield, launches fighters, sweeps the arena with bullet walls and
// fires heavy cannon salvos. It is a separate kind from the wave-5 boss.
export const MOTHERSHIP = {
  radius: 92,
  baseHp: 140,          // for a single pilot...
  hpPerShip: 70,        // ...plus this per extra pilot
  speed: 45,
  entryTime: 2.4,
  hitScore: 15,
  hitBounty: 3,
  killScore: 10000,
  color: '#b46bff',
  launchEvery: 7,       // seconds between fighter launches (5 when enraged)
  fighters: 2,          // fighters per launch (3 when enraged)
  maxFighters: 6,       // its own fighters in the air at once
  bullet: { speed: 210, life: 4, radius: 5 },
  shell: { speed: 160, life: 5, radius: 11 },   // the slow heavy cannon rounds
};

export const RULES = {
  lives: 3,
  respawnDelay: 1.8,
  invulnTime: 2.6,
  extraLifeEvery: 10000,
  killScore: 250,
  maxWaveSize: 14,      // enemies at the start of a wave (more keep arriving)
  speedGrowthPerWave: 0.04,
  gameOverDelay: 1.6,
  lobbyDemoRocks: 6,
  startMoney: 0,
  killBounty: 50,        // money for shooting down another jet (free-for-all)
  victoryDelay: 4.5,     // seconds of fireworks over the arena before the results
  shopInputLock: 0.6,    // seconds before shop presses count, so held fire keys don't buy
  devMoney: 1000,        // what the K testing key gives every pilot
  shieldHitInvuln: 1.2,  // grace time after the deflector absorbs a hit
};

// Waves last a fixed time while enemies keep arriving from the edges. When the
// time is up the survivors retreat and the shop opens. Boss waves (every
// BOSS.every-th) have no clock: wave 5's boss opens the shop when it falls,
// and the final wave is the Mothership - beating it wins the game.
export const WAVES = {
  duration: 60,          // seconds per wave
  final: 10,             // the Mothership's wave, which ends the game
  bossClearDelay: 2.5,   // seconds after a mid-game boss falls before the shop opens
  opening: 5,            // enemies at the start of wave 1...
  openingPerWave: 2,     // ...and this many more each wave after (capped by RULES.maxWaveSize)
  interval: 3.5,         // seconds between reinforcements on wave 1...
  intervalPerWave: -0.5, // ...this much shorter each wave after
  minInterval: 1.5,
  groupPerWave: 0.35,    // reinforcements arrive in groups of 1 + wave * this (rounded down)
  maxEnemies: 22,        // no reinforcements while this many enemies are up (launched drones included)
  maxZeppelins: 3,       // never more zeppelins than this at once
  quietEnd: 4,           // no reinforcements in the last seconds of a wave
};

export const DEFAULT_JOINED = [true, true];

// The landscape below the arena for each wave, in order (it cycles if there
// are ever more waves than entries). The lobby shows the first one.
export const SCENERY = [
  { key: 'forest', title: 'Swedish forest' },
  { key: 'coast', title: 'City coastline' },
  { key: 'alps', title: 'The Alps' },
  { key: 'realm', title: 'Fantasy realm' },
  { key: 'forest', title: 'Swedish forest' },   // wave 5: the first boss, back over home ground
  { key: 'desert', title: 'Sahara dunes' },
  { key: 'volcano', title: 'Volcanic isles' },
  { key: 'arctic', title: 'Arctic pack ice' },
  { key: 'neon', title: 'Neon city' },
  { key: 'moon', title: 'The Moon' },         // wave 10: the Mothership
];
export const sceneryForWave = wave => SCENERY[(Math.max(1, wave) - 1) % SCENERY.length];

// Every so often during play the camera swings to a random new angle around the
// arena (refitted so the whole arena stays on screen) to shake things up.
//   interval: seconds between swings (random in range), duration: seconds a swing takes
//   yaw: max turn around the vertical axis (radians, either way), tilt: range from straight down
export const CAMERA_SPIN = { interval: [9, 18], duration: 2.4, yaw: 0.65, tilt: [0.15, 0.85] };
