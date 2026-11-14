// FreeCell rules engine. Pure functions, no DOM.
// Card id 0..51: rank = floor(id / 4) + 1 (1 = A … 13 = K), suit = id % 4 (0 ♣, 1 ♦, 2 ♥, 3 ♠).
export const SUIT_SYMBOLS = ['♣', '♦', '♥', '♠'];
export const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const rank = (c) => Math.floor(c / 4) + 1;
export const suit = (c) => c % 4;
export const isRed = (c) => suit(c) === 1 || suit(c) === 2;
export const MAX_DEAL = 1000000;

// Classic numbered deals (the widely used linear-congruential shuffle), so "Game #N" is always the same layout.
export function deal(n) {
  let seed = n >>> 0;
  const rand = () => { seed = (seed * 214013 + 2531011) % 2147483648; return Math.floor(seed / 65536); };
  const deck = Array.from({ length: 52 }, (_, i) => 51 - i);
  for (let i = 0; i < 52; i++) {
    const j = 51 - (rand() % (52 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const cols = Array.from({ length: 8 }, () => []);
  deck.forEach((c, i) => cols[i % 8].push(c));
  return { cols, cells: [null, null, null, null], found: [0, 0, 0, 0] };
}

export const clone = (s) => ({ cols: s.cols.map((c) => c.slice()), cells: s.cells.slice(), found: s.found.slice() });
export const stacks = (lower, upper) => rank(upper) === rank(lower) + 1 && isRed(upper) !== isRed(lower);
export const isWon = (s) => s.found.every((r) => r === 13);
export const emptyCells = (s) => s.cells.filter((c) => c === null).length;
export const emptyCols = (s) => s.cols.filter((c) => !c.length).length;

// Length of the ordered run (alternating colours, descending) at the bottom of a column.
export function runLength(col) {
  if (!col.length) return 0;
  let n = 1;
  while (n < col.length && stacks(col[col.length - n], col[col.length - n - 1])) n++;
  return n;
}

// How many cards can move together, using free cells and empty columns as temporary space.
export function maxMovable(s, toEmptyColumn) {
  const cols = emptyCols(s) - (toEmptyColumn ? 1 : 0);
  return (emptyCells(s) + 1) * 2 ** Math.max(0, cols);
}

export function cardsAt(s, loc) {
  if (loc.t === 'col') return s.cols[loc.i];
  if (loc.t === 'cell') return s.cells[loc.i] === null ? [] : [s.cells[loc.i]];
  return [];
}

// move = { from: {t:'col'|'cell', i}, n, to: {t:'col'|'cell'|'found', i} }
export function isLegal(s, m) {
  const { from, to, n } = m;
  if (from.t === to.t && from.i === to.i) return false;
  const src = cardsAt(s, from);
  if (n < 1 || n > src.length) return false;
  if (from.t === 'col' && n > runLength(src)) return false;
  const first = src[src.length - n];
  if (to.t === 'found') return n === 1 && suit(first) === to.i && s.found[to.i] === rank(first) - 1;
  if (to.t === 'cell') return n === 1 && s.cells[to.i] === null;
  const dest = s.cols[to.i];
  if (n > maxMovable(s, !dest.length)) return false;
  return !dest.length || stacks(first, dest[dest.length - 1]);
}

export function apply(s, m) {
  const next = clone(s);
  let moved;
  if (m.from.t === 'col') moved = next.cols[m.from.i].splice(-m.n, m.n);
  else { moved = [next.cells[m.from.i]]; next.cells[m.from.i] = null; }
  if (m.to.t === 'col') next.cols[m.to.i].push(...moved);
  else if (m.to.t === 'cell') next.cells[m.to.i] = moved[0];
  else next.found[m.to.i] = rank(moved[0]);
  return next;
}

// A card is "safe" to send home automatically when no card that could still need it is left.
function isSafeHome(s, c) {
  const r = rank(c);
  if (s.found[suit(c)] !== r - 1) return false;
  if (r <= 2) return true;
  const opposite = isRed(c) ? [0, 3] : [1, 2];
  return opposite.every((x) => s.found[x] >= r - 1);
}
export function nextAutoMove(s) {
  for (let i = 0; i < 4; i++) {
    const c = s.cells[i];
    if (c !== null && isSafeHome(s, c)) return { from: { t: 'cell', i }, n: 1, to: { t: 'found', i: suit(c) } };
  }
  for (let i = 0; i < 8; i++) {
    const col = s.cols[i];
    const c = col[col.length - 1];
    if (c !== undefined && isSafeHome(s, c)) return { from: { t: 'col', i }, n: 1, to: { t: 'found', i: suit(c) } };
  }
  return null;
}

// Best destination when a card (and the run below it) is tapped.
export function bestMove(s, from, n) {
  const src = cardsAt(s, from);
  const first = src[src.length - n];
  if (first === undefined) return null;
  const tryMove = (to, count = n) => { const m = { from, n: count, to }; return isLegal(s, m) ? m : null; };
  if (n === 1) { const m = tryMove({ t: 'found', i: suit(first) }); if (m) return m; }
  for (let i = 0; i < 8; i++) if (s.cols[i].length) { const m = tryMove({ t: 'col', i }); if (m) return m; }
  // An empty column: only worth it if the card isn't already alone at the top of a column.
  if (!(from.t === 'col' && n === src.length)) {
    const empty = s.cols.findIndex((c) => !c.length);
    if (empty >= 0) {
      const count = Math.min(n, maxMovable(s, true));
      if (count === n) return tryMove({ t: 'col', i: empty });
    }
  }
  if (n === 1 && from.t === 'col') { const cell = s.cells.indexOf(null); if (cell >= 0) return tryMove({ t: 'cell', i: cell }); }
  return null;
}

// Every legal move (used for hints and to detect being stuck).
export function allMoves(s) {
  const moves = [];
  const sources = [];
  for (let i = 0; i < 4; i++) if (s.cells[i] !== null) sources.push({ from: { t: 'cell', i }, max: 1 });
  for (let i = 0; i < 8; i++) if (s.cols[i].length) sources.push({ from: { t: 'col', i }, max: runLength(s.cols[i]) });
  const targets = [
    ...[0, 1, 2, 3].map((i) => ({ t: 'found', i })),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ t: 'col', i })),
    ...[0, 1, 2, 3].map((i) => ({ t: 'cell', i })),
  ];
  for (const { from, max } of sources) {
    for (let n = 1; n <= max; n++) for (const to of targets) {
      const m = { from, n, to };
      if (isLegal(s, m)) moves.push(m);
    }
  }
  return moves;
}

// A gentle hint: prefer moves that make real progress over shuffling cards around.
export function hint(s) {
  let best = null;
  let bestScore = -Infinity;
  for (const m of allMoves(s)) {
    const src = cardsAt(s, m.from);
    const leavesBehind = m.from.t === 'col' ? src.length - m.n : 0;
    let score = 0;
    if (m.to.t === 'found') score = 100;
    else if (m.to.t === 'col' && s.cols[m.to.i].length) {
      if (m.from.t === 'cell') score = 80;
      else if (leavesBehind === 0) score = 70;                       // empties a column
      else if (stacks(src[src.length - m.n], src[src.length - m.n - 1])) continue; // splits a run: pointless
      else score = 60 + m.n;
    } else if (m.to.t === 'col') {
      if (m.from.t === 'col' && leavesBehind === 0) continue;         // empty column to empty column
      if (m.from.t === 'col' && stacks(src[src.length - m.n], src[src.length - m.n - 1])) continue;
      score = m.from.t === 'cell' ? 30 : 20 + m.n;
    } else if (m.to.t === 'cell') {
      if (m.to.i !== s.cells.indexOf(null)) continue;
      score = 10 - Math.min(9, leavesBehind);
    }
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

export const isStuck = (s) => !isWon(s) && allMoves(s).length === 0;
