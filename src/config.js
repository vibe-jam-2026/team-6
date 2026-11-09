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
// 1–9 / 0 jump straight to wave 1–9 / 10, N skips to the next wave, B jumps to the next boss.
export const TEST_KEYS = {
  invincible: 'KeyG',
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

export const ASTEROID_TYPES = {
  3: { radius: 46, speed: [35, 75],  score: 20 },
  2: { radius: 25, speed: [65, 120], score: 50 },
  1: { radius: 13, speed: [95, 175], score: 100 },
};

// The boss arrives on every `every`-th wave (wave 5, 10, ... - i.e. right after wave 4).
export const BOSS = {
  every: 5,
  radius: 64,
  baseHp: 45,           // hit points for a single pilot...
  hpPerShip: 25,        // ...plus this per extra pilot
  hpGrowth: 0.5,        // each later boss gets 50 % more
  speed: 70,
  entryTime: 1.6,       // seconds it warps in, untouchable
  hitScore: 10,         // per bullet that lands
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
  waveDelay: 1.5,
  maxWaveSize: 14,
  speedGrowthPerWave: 0.04,
  gameOverDelay: 1.6,
  lobbyDemoRocks: 6,
  upgradeChoices: 3,     // upgrades offered to each player between waves
  upgradeInputLock: 0.6, // seconds before a pick counts, so held fire keys don't auto-pick
  shieldHitInvuln: 1.2,  // grace time after the deflector absorbs a hit
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
