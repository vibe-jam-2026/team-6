// Everything the shop sells between waves. Each upgrade changes the ship's own
// stats, so ships stay independent of each other. cost is the price of the
// first level; every level after costs costGrowth times the one before.
// Add an upgrade by appending an entry here; nothing else needs to change.
export const UPGRADES = [
  { id: 'rapidFire', name: 'RAPID FIRE', color: '#ff8a5c', cost: 150, costGrowth: 1.6, maxLevel: 4,
    description: 'fire rate +25%',
    apply: s => { s.stats.fireCooldown /= 1.25; } },
  { id: 'afterburner', name: 'AFTERBURNER', color: '#ffb347', cost: 120, costGrowth: 1.6, maxLevel: 4,
    description: 'thrust +20% · top speed +12%',
    apply: s => { s.stats.thrust *= 1.2; s.stats.maxSpeed *= 1.12; } },
  { id: 'gyro', name: 'GYRO THRUSTERS', color: '#c7a6ff', cost: 100, costGrowth: 1.6, maxLevel: 3,
    description: 'turn speed +20%',
    apply: s => { s.stats.turnSpeed *= 1.2; } },
  { id: 'magazine', name: 'BIG MAGAZINE', color: '#ffd23f', cost: 120, costGrowth: 1.6, maxLevel: 3,
    description: '+2 shots in the air',
    apply: s => { s.stats.maxBullets += 2; } },
  { id: 'railRounds', name: 'RAIL ROUNDS', color: '#7aa7ff', cost: 140, costGrowth: 1.6, maxLevel: 3,
    description: 'shot speed +20% · range +15%',
    apply: s => { s.stats.bulletSpeed *= 1.2; s.stats.bulletLife *= 1.15; } },
  { id: 'spread', name: 'SPREAD SHOT', color: '#9dff5c', cost: 400, costGrowth: 1.8, maxLevel: 2,
    description: '+1 bullet per shot',
    apply: s => { s.stats.shots += 1; s.stats.maxBullets += 2; } },
  { id: 'deflector', name: 'DEFLECTOR', color: '#4dd2ff', cost: 300, costGrowth: 1.8, maxLevel: 2,
    description: 'blocks 1 hit each wave',
    apply: s => { s.stats.shieldCapacity += 1; } },
  { id: 'spareShip', name: 'SPARE SHIP', color: '#ff5d73', cost: 250, costGrowth: 1.3, maxLevel: Infinity,
    description: '+1 life',
    apply: s => { s.lives += 1; } },
];
