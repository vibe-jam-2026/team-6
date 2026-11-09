import { PLAYERS } from '../../config.js';

const GAP = 12;
const CARD_HEIGHT = 150;

// Where the lobby cards go. Shared by the 2D cards and the 3D ships on them.
export function lobbyLayout(width, height) {
  const small = width < 760;
  const cols = small ? 2 : 4;
  const cardW = Math.min(230, (width - 40) / cols - GAP);
  const totalW = cols * cardW + (cols - 1) * GAP;
  const top = height * 0.32;
  const cards = PLAYERS.map((_, i) => {
    const x = width / 2 - totalW / 2 + (i % cols) * (cardW + GAP);
    const y = top + Math.floor(i / cols) * (CARD_HEIGHT + GAP);
    return { x, y, w: cardW, h: CARD_HEIGHT, shipX: x + cardW / 2, shipY: y + 44 };
  });
  const rows = Math.ceil(PLAYERS.length / cols);
  return { small, cards, footerY: top + rows * (CARD_HEIGHT + GAP) + 24 };
}
