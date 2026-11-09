import { PLAYERS } from '../../config.js';

const GAP = 12;
const CARD_HEIGHT = 150;
const SHORT_CARD_HEIGHT = 110; // no room for the key hints

// Where the lobby cards go. Shared by the 2D cards and the 3D ships on them.
export function lobbyLayout(width, height) {
  const small = width < 760;
  // short screens (a phone on its side) get one row of compact cards so the start line fits
  const short = height < 500;
  const cols = small && !short ? 2 : 4;
  const cardH = short ? SHORT_CARD_HEIGHT : CARD_HEIGHT;
  const cardW = Math.min(230, (width - 40) / cols - GAP);
  const totalW = cols * cardW + (cols - 1) * GAP;
  const top = height * (short ? 0.27 : 0.32);
  const cards = PLAYERS.map((_, i) => {
    const x = width / 2 - totalW / 2 + (i % cols) * (cardW + GAP);
    const y = top + Math.floor(i / cols) * (cardH + GAP);
    return { x, y, w: cardW, h: cardH, shipX: x + cardW / 2, shipY: y + 44 };
  });
  const rows = Math.ceil(PLAYERS.length / cols);
  const footerY = top + rows * (cardH + GAP) + 24;
  // the mode and start lines double as tap targets for touch controls
  return { small, short, cards, footerY, modeY: footerY + 30, startY: footerY + 66 };
}
