// Garden Rails: level settings, track-layout generator and adaptive difficulty. Pure functions, no DOM.
export const MAX_LEVEL = 10;
export const TRAINS_PER_ROUND = 25;
const COLOR_COUNTS = [4, 4, 5, 5, 6, 6, 7, 7, 8, 8];

export const clampLevel = (l) => Math.max(1, Math.min(MAX_LEVEL, Math.round(l) || 1));

// Per level: board size, how long the trunk and each branch are, and the shortest allowed route to a house.
// Higher levels use bigger boards with much longer routes, so several trains are on the track at once.
const TRACKS = [
  // [w, h, trunkMin, trunkMax, branchMin, branchMax, minDepth]
  [10, 8, 5, 7, 2, 5, 5],  [11, 8, 5, 7, 3, 5, 6],  [12, 8, 5, 8, 3, 5, 6],   [12, 9, 6, 8, 3, 6, 7],
  [13, 9, 6, 9, 3, 6, 8],  [14, 9, 6, 9, 3, 6, 9],  [14, 10, 7, 10, 3, 6, 9], [15, 10, 7, 10, 3, 7, 10],
  [16, 10, 8, 11, 3, 7, 10], [17, 11, 8, 12, 3, 7, 11],
];

export function levelConfig(level) {
  const L = clampLevel(level);
  const [w, h, trunkMin, trunkMax, branchMin, branchMax, minDepth] = TRACKS[L - 1];
  return {
    level: L,
    colors: COLOR_COUNTS[L - 1],
    interval: +(3.2 - (L + 2) * 0.164).toFixed(2), // seconds between trains (Lv 1 here was Lv 4 in the first version)
    speed: +(1.6 + (L + 2) * 0.036).toFixed(2),     // grid cells per second
    points: L * 10,                                 // points per correct train
    w, h, trunk: [trunkMin, trunkMax], branch: [branchMin, branchMax], minDepth,
  };
}

// Small seeded random generator so layouts can be reproduced in tests.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Build a branching track: one tunnel, (stations - 1) two-way switches, one house per colour.
export function generate(cfg, portrait = false, rand = Math.random) {
  const [w, h] = portrait ? [cfg.h, cfg.w] : [cfg.w, cfg.h];
  for (let attempt = 0; attempt < 5000; attempt++) {
    const layout = tryGenerate(cfg, w, h, rand);
    if (layout) return layout;
  }
  throw new Error('Could not build a track layout');
}

function tryGenerate(cfg, w, h, rand) {
  const K = cfg.colors;
  const span = ([lo, hi]) => lo + int(hi - lo + 1);
  const int = (n) => Math.floor(rand() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = int(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nodes = new Map();
  const key = (x, y) => y * w + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const stationsList = [];

  const add = (x, y, type, parent) => {
    const n = { id: key(x, y), x, y, type, parent, children: [], state: 0, depth: parent ? parent.depth + 1 : 0 };
    nodes.set(n.id, n);
    if (parent) parent.children.push(n);
    if (type === 'station') stationsList.push(n);
    return n;
  };
  const nearStation = (x, y, except) => stationsList.some((s) => s !== except && Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);

  // Can the walk step from (px,py) into (x,y)?  `tmp` holds the walk's own cells.
  const canEnter = (x, y, px, py, tmp, last) => {
    if (!inside(x, y) || nodes.has(key(x, y)) || tmp.has(key(x, y))) return false;
    if (nearStation(x, y)) return false;
    const around = last ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] : DIRS;
    for (const [dx, dy] of around) {
      const nx = x + dx, ny = y + dy;
      if (nx === px && ny === py) continue;
      if (nodes.has(key(nx, ny)) || tmp.has(key(nx, ny))) return false;
    }
    return true;
  };

  const walk = (from, length, firstDir) => {
    const cells = [];
    const tmp = new Set();
    let px = from.x, py = from.y, dir = firstDir;
    for (let i = 0; i < length; i++) {
      const last = i === length - 1;
      let options = shuffle(DIRS.slice());
      if (dir && rand() < 0.75) options = [dir, ...options.filter((d) => d !== dir)];
      if (i === 0 && firstDir) options = [firstDir];
      const step = options.find(([dx, dy]) => canEnter(px + dx, py + dy, px, py, tmp, last));
      if (!step) return null;
      px += step[0]; py += step[1]; dir = step;
      tmp.add(key(px, py));
      cells.push([px, py]);
    }
    return cells;
  };
  const build = (from, cells) => {
    let parent = from;
    cells.forEach(([x, y], i) => { parent = add(x, y, i === cells.length - 1 ? 'station' : 'track', parent); });
  };

  // Tunnel on one edge, facing inwards.
  const side = int(4);
  let tx, ty, dir;
  if (side === 0) { tx = 0; ty = 1 + int(h - 2); dir = [1, 0]; }
  else if (side === 1) { tx = w - 1; ty = 1 + int(h - 2); dir = [-1, 0]; }
  else if (side === 2) { tx = 1 + int(w - 2); ty = 0; dir = [0, 1]; }
  else { tx = 1 + int(w - 2); ty = h - 1; dir = [0, -1]; }
  const tunnel = add(tx, ty, 'tunnel', null);
  const trunk = walk(tunnel, span(cfg.trunk), dir);
  if (!trunk) return null;
  build(tunnel, trunk);

  // Grow one branch at a time. Sample several possible branches and keep the one whose house is
  // furthest from the others, so the houses spread out and leave room for the rest.
  while (stationsList.length < K) {
    const switches = [...nodes.values()].filter((n) => n.type === 'switch');
    const candidates = [...nodes.values()].filter((n) => n.type === 'track' && n.children.length === 1 && n.depth >= 2 &&
      !switches.some((s) => Math.abs(s.x - n.x) <= 1 && Math.abs(s.y - n.y) <= 1));
    if (!candidates.length) return null;
    let best = null, bestScore = -Infinity;
    for (let sample = 0; sample < 40; sample++) {
      const c = candidates[int(candidates.length)];
      const d = DIRS[int(4)];
      if (nodes.has(key(c.x + d[0], c.y + d[1]))) continue;
      const cells = walk(c, span(cfg.branch), d);
      if (!cells) continue;
      const [ex, ey] = cells[cells.length - 1];
      const spread = Math.min(...stationsList.map((st) => Math.abs(st.x - ex) + Math.abs(st.y - ey)));
      const score = spread + rand() * 2;
      if (score > bestScore) { bestScore = score; best = { c, cells }; }
    }
    if (!best) return null;
    best.c.type = 'switch';
    build(best.c, best.cells);
  }
  if (stationsList.length < K) return null;
  if (stationsList.some((s) => s.depth < cfg.minDepth)) return null;

  const colors = shuffle([...Array(K).keys()]);
  stationsList.forEach((s, i) => { s.color = colors[i]; });
  const all = [...nodes.values()];
  for (const s of all.filter((n) => n.type === 'switch')) s.state = int(2);
  // Trim empty rows and columns (keeping one cell of breathing room) so the board uses its space well.
  const minX = Math.max(0, Math.min(...all.map((n) => n.x)) - 1), maxX = Math.min(w - 1, Math.max(...all.map((n) => n.x)) + 1);
  const minY = Math.max(0, Math.min(...all.map((n) => n.y)) - 1), maxY = Math.min(h - 1, Math.max(...all.map((n) => n.y)) + 1);
  for (const n of all) { n.x -= minX; n.y -= minY; }
  w = maxX - minX + 1; h = maxY - minY + 1;
  return { w, h, nodes: all, tunnel, switches: all.filter((n) => n.type === 'switch'), stations: stationsList };
}

// Next node a train takes after arriving at `node`.
export const nextNode = (node) => (node.children.length === 2 ? node.children[node.state] : node.children[0]);

// ---- Adaptive difficulty ----
// Each round gets a rating: the level played, nudged by accuracy. The next level is the average of the last three ratings.
export function rating(level, accuracy) {
  const bonus = accuracy >= 0.92 ? 1 : accuracy >= 0.8 ? 0.5 : accuracy >= 0.65 ? 0 : accuracy >= 0.5 ? -0.5 : -1;
  return Math.max(1, Math.min(MAX_LEVEL, level + bonus));
}
export function adaptiveLevel(history) {
  const recent = history.slice(-3);
  if (!recent.length) return 1;
  return clampLevel(recent.reduce((sum, g) => sum + g.rating, 0) / recent.length);
}
// First round of the day: a random level near the player's usual level (any of 1–4 for a newcomer).
export function randomDailyLevel(history, rand = Math.random) {
  const base = adaptiveLevel(history);
  const lo = Math.max(1, base - 2), hi = Math.min(MAX_LEVEL, base + 2);
  return lo + Math.floor(rand() * (hi - lo + 1));
}
