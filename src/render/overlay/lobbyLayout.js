import { PLAYERS, MENU_KEYS, TEST_KEYS, WAVES } from '../../config.js';

const GAP = 12;
const CARD_HEIGHT = 182;
const SHORT_CARD_HEIGHT = 110; // no room for the key hints

// The lobby's option buttons, in order. Each one stands for a hotkey: clicking
// or tapping it presses that key, so the keyboard and the buttons share one code path.
// touchOnly / desktopOnly hide an option that makes no sense on that device.
export const LOBBY_OPTIONS = [
  { id: 'mode', label: 'MODE', key: MENU_KEYS.switchMode, hint: 'TAB' },
  { id: 'computer', label: 'P2 PILOT', key: MENU_KEYS.computer, hint: 'V' },
  { id: 'cpuSkill', label: 'CPU SKILL', key: MENU_KEYS.cpuSkill, hint: 'L' },
  { id: 'mouse', label: 'MOUSE', key: MENU_KEYS.mouse, hint: 'C', desktopOnly: true },
  { id: 'camera', label: 'CAMERA', key: MENU_KEYS.firstPerson, hint: 'F' },
  { id: 'sound', label: 'SOUND', key: MENU_KEYS.mute, hint: 'M' },
  { id: 'demo', label: 'DEMO', key: MENU_KEYS.demo, hint: 'X' },
  { id: 'invincible', label: 'INVINCIBLE', key: TEST_KEYS.invincible, hint: 'G' },
];

// Where everything on the lobby screen goes. Shared by the 2D view (to draw),
// the 3D ships on the cards and the pointer handler (to hit-test clicks and taps).
export function lobbyLayout(width, height, { tap = false } = {}) {
  const small = width < 760;
  // short screens (a phone on its side) get one row of compact cards so the menu fits
  const short = height < 500;
  const cols = Math.min(PLAYERS.length, small && !short ? 2 : 4);
  const cardH = short ? SHORT_CARD_HEIGHT : CARD_HEIGHT;
  const cardW = Math.min(230, (width - 40) / cols - GAP);
  const totalW = cols * cardW + (cols - 1) * GAP;
  const top = height * (short ? 0.24 : 0.3);
  const cards = PLAYERS.map((_, i) => {
    const x = width / 2 - totalW / 2 + (i % cols) * (cardW + GAP);
    const y = top + Math.floor(i / cols) * (cardH + GAP);
    return { x, y, w: cardW, h: cardH, shipX: x + cardW / 2, shipY: y + 44, key: PLAYERS[i].keys.fire };
  });
  const rows = Math.ceil(PLAYERS.length / cols);
  const footerY = top + rows * (cardH + GAP) + (short ? 10 : 18);   // the "click a card to join" line

  // the big start button
  const startH = short ? 34 : 44, startW = Math.min(360, width - 32);
  const start = { x: width / 2 - startW / 2, y: footerY + (short ? 14 : 20), w: startW, h: startH, key: MENU_KEYS.start };

  // the options, in a grid of equal buttons
  const options = LOBBY_OPTIONS.filter(o => !(tap && o.desktopOnly));
  const optCols = width >= 860 ? 4 : width >= 560 ? Math.min(4, Math.ceil(options.length / 2)) : 2;
  const optH = short ? 30 : 38, optGap = short ? 6 : 8;
  const optW = Math.min(196, (width - 32 - (optCols - 1) * optGap) / optCols);
  const gridTop = start.y + startH + (short ? 10 : 16);
  const optRows = Math.ceil(options.length / optCols);
  const buttons = options.map((o, i) => {
    const row = Math.floor(i / optCols), inRow = Math.min(optCols, options.length - row * optCols);
    const rowW = inRow * optW + (inRow - 1) * optGap;
    return { ...o, x: width / 2 - rowW / 2 + (i % optCols) * (optW + optGap), y: gridTop + row * (optH + optGap), w: optW, h: optH };
  });
  let y = gridTop + optRows * (optH + optGap) + 4;

  // testing: a row of small buttons that start the match at a given wave (the digit keys)
  let waves = null;
  if (!short) {
    const n = Math.min(WAVES.final, TEST_KEYS.waves.length), size = 26, gap = 4, labelW = 110;
    const rowW = labelW + n * size + (n - 1) * gap;
    if (rowW <= width - 32) {
      const left = width / 2 - rowW / 2 + labelW;
      waves = {
        labelX: left - 10, y: y + size / 2,
        buttons: Array.from({ length: n }, (_, i) => ({ wave: i + 1, key: TEST_KEYS.waves[i], x: left + i * (size + gap), y, w: size, h: size })),
      };
      y += size + 8;
    }
  }

  return { small, short, cards, footerY, start, buttons, waves, noteY: y + 8 };
}

// Every clickable thing on the lobby screen as { x, y, w, h, key }.
export function lobbyTargets(layout) {
  return [...layout.cards, layout.start, ...layout.buttons, ...(layout.waves?.buttons ?? [])];
}

export const hit = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
