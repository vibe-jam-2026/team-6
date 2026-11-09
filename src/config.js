// All tunable data lives here. Nothing in this file has behaviour.

export const PLAYERS = [
  { name: 'P1', color: '#ff5d73', keys: { thrust: 'KeyW', left: 'KeyA', right: 'KeyD', fire: 'KeyS', selfDestruct: 'KeyE', weapon: 'KeyQ' },
    labels: ['W thrust', 'A/D turn', 'S fire', 'Q switch weapon', 'E self-destruct'] },
  { name: 'P2', color: '#4dd2ff', keys: { thrust: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', fire: 'ArrowDown', selfDestruct: 'ShiftRight', weapon: 'Slash' },
    labels: ['↑ thrust', '←/→ turn', '↓ fire', '/ switch weapon', 'R-Shift self-destruct'] },
];

// the player the lobby's computer key hands to the computer (P2)
export const COMPUTER_PLAYER = 1;

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
export const WEAPONS = [
  { id: 'rockets', name: 'ROCKETS', color: '#e8ecf4',
    cooldown: 1, speed: 1, life: 1, shots: 0, spread: 1, magazine: 0, size: 1 },
  { id: 'blaster', name: 'BLASTER', color: '#ffd23f',
    cooldown: 0.45, speed: 1.35, life: 0.7, shots: 0, spread: 1, magazine: 4, size: 0.7 },
  { id: 'scatter', name: 'SCATTER', color: '#9dff5c',
    cooldown: 2.1, speed: 0.9, life: 0.5, shots: 4, spread: 1.6, magazine: 8, size: 0.85 },
];

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
  victoryDelay: 3,       // seconds the final boss explosion plays before the results
  shopInputLock: 0.6,    // seconds before shop presses count, so held fire keys don't buy
  devMoney: 1000,        // what the K testing key gives every pilot
  shieldHitInvuln: 1.2,  // grace time after the deflector absorbs a hit
};

// Waves last a fixed time while enemies keep arriving from the edges. When the
// time is up the survivors retreat and the shop opens. The final wave is the
// boss fight; it has no clock and beating the boss wins the game.
export const WAVES = {
  duration: 60,          // seconds per wave
  final: 5,              // the boss wave that ends the game
  opening: 5,            // enemies at the start of wave 1...
  openingPerWave: 2,     // ...and this many more each wave after (capped by RULES.maxWaveSize)
  interval: 3.5,         // seconds between reinforcements on wave 1...
  intervalPerWave: -0.5, // ...this much shorter each wave after
  minInterval: 1.5,
  groupPerWave: 0.5,     // reinforcements arrive in groups of 1 + wave * this (rounded down)
  maxEnemies: 22,        // no reinforcements while this many enemies are up (launched drones included)
  maxZeppelins: 3,       // never more zeppelins than this at once
  quietEnd: 4,           // no reinforcements in the last seconds of a wave
};

export const DEFAULT_JOINED = [true, true];

// The landscape below the arena changes with every wave and cycles through
// this list. The lobby shows the first one.
export const SCENERY = [
  { key: 'forest', title: 'Swedish forest' },
  { key: 'coast', title: 'City coastline' },
  { key: 'alps', title: 'The Alps' },
  { key: 'realm', title: 'Fantasy realm' },
];
export const sceneryForWave = wave => SCENERY[(Math.max(1, wave) - 1) % SCENERY.length];
