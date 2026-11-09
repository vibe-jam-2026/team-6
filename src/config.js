// All tunable data lives here. Nothing in this file has behaviour.

export const PLAYERS = [
  { name: 'P1', color: '#ff5d73', keys: { thrust: 'KeyW', left: 'KeyA', right: 'KeyD', fire: 'KeyS' },
    labels: ['W thrust', 'A/D turn', 'S fire'] },
  { name: 'P2', color: '#4dd2ff', keys: { thrust: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', fire: 'ArrowDown' },
    labels: ['↑ thrust', '←/→ turn', '↓ fire'] },
];

export const MENU_KEYS = {
  start: 'Enter',
  switchMode: 'Tab',
  mute: 'KeyM',
  pause: ['KeyP', 'Escape'],
  quit: 'KeyQ',
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
