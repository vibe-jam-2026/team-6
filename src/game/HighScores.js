// The best scores on this device, kept in the browser's localStorage. Storage
// can be missing or blocked (private windows, previews), so every access is
// guarded and the table simply starts empty then.
const STORAGE_KEY = 'mach-mania.highscores.v1';
export const HIGH_SCORE_SLOTS = 10;

function openStorage() {
  try { return window.localStorage; } catch { return null; }
}

export class HighScores {
  entries = []; // { initials, score, wave, won, mode, color, at } best first

  constructor(storage = openStorage()) {
    this.storage = storage;
    try {
      const saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '[]');
      if (Array.isArray(saved)) this.entries = saved.filter(e => Number.isFinite(e?.score)).slice(0, HIGH_SCORE_SLOTS);
    } catch { this.entries = []; }
  }

  // would this score make the table?
  qualifies(score) {
    if (score <= 0) return false;
    return this.entries.length < HIGH_SCORE_SLOTS || score > this.entries[this.entries.length - 1].score;
  }

  // Adds an entry and returns it (null if it didn't make the table).
  add({ initials, score, wave, won = false, mode = '', color = '#e8ecf4' }) {
    if (!this.qualifies(score)) return null;
    const entry = { initials: initials.slice(0, 3).toUpperCase(), score, wave, won, mode, color, at: Date.now() };
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score || a.at - b.at);
    this.entries = this.entries.slice(0, HIGH_SCORE_SLOTS);
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.entries)); } catch { /* storage full or blocked */ }
    return this.entries.includes(entry) ? entry : null;
  }

  top(n = HIGH_SCORE_SLOTS) { return this.entries.slice(0, n); }
}
