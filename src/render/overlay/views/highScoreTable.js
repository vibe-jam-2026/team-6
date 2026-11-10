// Draws the high-score list: rank, initials (in the pilot's colour), wave and
// score. Entries in `highlight` (just added) pulse. Returns the height used.
export function drawHighScores(o, entries, { x, y, width, rows = 5, highlight = [], time = 0, title = 'HIGH SCORES' }) {
  o.text(title, x, y, 13, '#ffd23f', 'center', '#ffd23f');
  if (!entries.length) {
    o.text('no scores yet · be the first', x, y + 24, 12, '#7d8496', 'center');
    return 40;
  }
  const left = x - width / 2, right = x + width / 2;
  entries.slice(0, rows).forEach((e, k) => {
    const ry = y + 24 + k * 19, isNew = highlight.includes(e);
    const draw = () => {
      o.text(`${k + 1}.`, left, ry, 12, '#7d8496', 'left');
      o.text(e.initials, left + 30, ry, 14, e.color ?? '#e8ecf4', 'left', isNew ? e.color : null);
      o.text(e.won ? '★ victory' : `wave ${e.wave}`, x + 18, ry, 11, e.won ? '#ffd23f' : '#7d8496', 'center');
      o.text(String(e.score), right, ry, 14, '#e8ecf4', 'right', isNew ? '#ffd23f' : null);
    };
    if (isNew) o.withAlpha(0.7 + 0.3 * Math.sin(time / 150), draw); else draw();
  });
  return 30 + Math.min(rows, entries.length) * 19;
}
