import { FLYOVER } from '../../../config.js';

// The credits that roll over the victory flyover: one card per landscape,
// fading in and out, with the landscape's name in the corner.
const CARDS = [
  ['MACH MANIA', 'the skies are safe again'],
  ['A VIBE JAM 2026 GAME', 'made by Team 6'],
  ['YOUR JET', 'Saab JAS 39 Gripen E'],
  ['THE ENEMY', 'zeppelins · fighters · drones · AA guns'],
  ['THE BOSSES', 'the Boss · the Mothership'],
  ['BUILT WITH', 'Three.js · Web Audio'],
  ['NO IMAGES, NO SOUND FILES', 'every model, landscape and note is made in code'],
  ['MADE WITH', 'Claude Code'],
  ['YOUR PILOTS', null], // filled in with the final scores
  ['THANKS FOR PLAYING!', null],
];

export class CreditsView {
  draw(o, { session, touch }) {
    const fly = session.flyover;
    if (!fly) return;
    const { width: W, height: H } = o;
    const k = Math.min(fly.t / 0.6, (FLYOVER.perLandscape - fly.t) / 0.6, 1); // fade in and out
    o.edgeShade('top', 120, 0.5);
    o.edgeShade('bottom', 160, 0.7);
    o.withAlpha(Math.max(0, k), () => {
      const [title, line] = CARDS[fly.index] ?? CARDS[CARDS.length - 1];
      o.band(H * 0.78, 110, 0.5);
      o.text(title, W / 2, H * 0.78 - 18, 30, '#ffe9a8', 'center', '#ffd23f');
      if (line) o.text(line, W / 2, H * 0.78 + 20, 16, '#e8ecf4', 'center');
      else if (fly.index === CARDS.length - 2 && session.result) {
        const pilots = session.result.ranked.map(s => `${s.name}  ${s.score}`).join('   ·   ');
        o.text(pilots, W / 2, H * 0.78 + 20, 16, '#e8ecf4', 'center');
      } else o.text(touch?.enabled ? 'tap for the results' : 'ENTER  see the results', W / 2, H * 0.78 + 20, 16, '#e8ecf4', 'center');
      o.text(`${fly.index + 1} / ${fly.count}  ·  ${fly.title.toUpperCase()}`, 22, 28, 14, '#c3cad8', 'left');
    });
    o.text(touch?.enabled ? 'tap to skip' : 'ENTER  skip', W - 22, 28, 12, '#9aa1b2', 'right');
  }
}
