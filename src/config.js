// All tunable data lives here. Nothing in this file has behaviour.

export const PLAYERS = [
  { name: 'P1', color: '#ff5d73', keys: { thrust: 'KeyW', left: 'KeyA', right: 'KeyD', fire: 'KeyS', selfDestruct: 'KeyE' },
    labels: ['W thrust', 'A/D turn', 'S fire', 'E self-destruct'] },
  { name: 'P2', color: '#4dd2ff', keys: { thrust: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', fire: 'ArrowDown', selfDestruct: 'ShiftRight' },
    labels: ['↑ thrust', '←/→ turn', '↓ fire', 'R-Shift self-destruct'] },
];

// card hints for whoever the lobby gives the mouse to (their keys still work too)
export const MOUSE_LABELS = ['mouse aims', 'right btn thrust', 'left btn fire', 'middle btn self-destruct'];

export const MENU_KEYS = {
  start: 'Enter',
  switchMode: 'Tab',
  mute: 'KeyM',
  pause: ['KeyP', 'Escape'],
  quit: 'KeyQ',
  mouse: 'KeyC',     // lobby: hand the mouse to nobody / P1 / P2
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
