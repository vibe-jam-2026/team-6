export const TAU = Math.PI * 2;
export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = list => list[Math.floor(Math.random() * list.length)];

export function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function circlesOverlap(a, ar, b, br) {
  const r = ar + br;
  return dist2(a, b) < r * r;
}
