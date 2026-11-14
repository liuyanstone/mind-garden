import * as E from './engine.mjs?v=1';
import * as Sound from './sound.mjs?v=1';

const TEXT = {
  zh: {
    title: '空当接龙 · FreeCell', name: '空当接龙', time: '时间', moves: '步数', language: '语言',
    newGame: '新的一局', undo: '撤销', hint: '提示', restart: '重新开始', help: '玩法与记录',
    deal: '第 {n} 局', cells: '空当', foundations: '收牌区',
    howTitle: '怎么玩',
    rule1: '目标：把 52 张牌按花色从 A 到 K，依次收进右上方的四个收牌区。',
    rule2: '牌列中只能“红黑相间、点数递减”地叠放，例如黑 8 放在红 9 上。空出的牌列可以放任意牌。',
    rule3: '左上方四个空当，每个可以暂放一张牌。空当和空列越多，一次能移动的牌越多。',
    rule4: '点一张牌选中它，再点想去的位置；或者再点一次，它会自动去最合适的地方。也可以直接拖动。',
    rule5: '可以随时撤销，卡住时点“提示”。安全的牌会自动收进收牌区。几乎每一局都有解，慢慢来。',
    statsTitle: '我的记录', played: '已玩', won: '完成', streak: '连胜', bestTime: '最快',
    pickDeal: '选择牌局编号', playDeal: '开始这一局', close: '知道了',
    winTitle: '完成了！', winText: '第 {n} 局，用时 {time}，共 {moves} 步。', lookAgain: '看看牌桌', cancel: '取消',
    confirmNew: '这一局还没完成，确定开始新的一局吗？', confirmRestart: '确定从头重新开始这一局吗？',
    confirmDeal: '这一局还没完成，确定换成第 {n} 局吗？', ok: '确定',
    soundOn: '声音：开', soundOff: '声音：关',
    noHint: '暂时找不到好走法，可以试试撤销几步。', stuck: '没有可以移动的牌了。点“撤销”退回几步，再换个思路。',
    tooMany: '现在一次最多能移动 {n} 张牌。空出空当或牌列，就能移动更多。',
    badDeal: '请输入 1 到 1000000 之间的数字。',
    suits: ['梅花', '方块', '红桃', '黑桃'], table: '牌桌', emptyCell: '空当', emptyCol: '空列', foundation: '{s}收牌区',
  },
  en: {
    title: 'FreeCell · 空当接龙', name: 'FreeCell', time: 'Time', moves: 'Moves', language: 'Language',
    newGame: 'New game', undo: 'Undo', hint: 'Hint', restart: 'Restart', help: 'Rules & stats',
    deal: 'Game #{n}', cells: 'Free cells', foundations: 'Foundations',
    howTitle: 'How to play',
    rule1: 'Goal: move all 52 cards to the four foundations at the top right, by suit, from Ace up to King.',
    rule2: 'In the columns, build down in alternating colours — for example a black 8 on a red 9. Any card can go into an empty column.',
    rule3: 'The four free cells at the top left each hold one card. More empty cells and columns let you move longer runs at once.',
    rule4: 'Tap a card to select it, then tap where it should go — or tap it again to send it to the best spot. You can also drag.',
    rule5: 'Undo any time, and use Hint when you are stuck. Safe cards go home automatically. Nearly every deal can be solved — take your time.',
    statsTitle: 'My stats', played: 'Played', won: 'Won', streak: 'Streak', bestTime: 'Best time',
    pickDeal: 'Choose a game number', playDeal: 'Play this game', close: 'Got it',
    winTitle: 'Solved!', winText: 'Game #{n} in {time}, {moves} {movesWord}.', lookAgain: 'View the table', cancel: 'Cancel',
    confirmNew: 'This game is not finished yet. Start a new one?', confirmRestart: 'Start this game again from the beginning?',
    confirmDeal: 'This game is not finished yet. Switch to game #{n}?', ok: 'OK',
    soundOn: 'Sound: on', soundOff: 'Sound: off',
    noHint: 'No obvious good move right now. Try undoing a few moves.', stuck: 'No cards can move. Undo a few moves and try another way.',
    tooMany: 'You can move at most {n} cards at once right now. Free up cells or columns to move more.',
    badDeal: 'Please enter a number from 1 to 1000000.',
    suits: ['Clubs', 'Diamonds', 'Hearts', 'Spades'], table: 'Table', emptyCell: 'Free cell', emptyCol: 'Empty column', foundation: '{s} foundation',
  },
};

const $ = (s) => document.querySelector(s);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const readJSON = (k, fallback) => { try { return JSON.parse(read(k)) ?? fallback; } catch { return fallback; } };

const LANG_KEY = 'freecell-language', SAVE_KEY = 'freecell-save', STATS_KEY = 'freecell-stats', SOUND_KEY = 'freecell-sound';
let soundOn = read(SOUND_KEY) !== 'off';
Sound.setEnabled(soundOn);
const FOUND_ORDER = [3, 2, 0, 1]; // ♠ ♥ ♣ ♦ from left to right

let lang = read(LANG_KEY) || (/^zh/i.test(navigator.language) ? 'zh' : 'en');
if (!TEXT[lang]) lang = 'zh';
const t = () => TEXT[lang];
const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

let stats = { played: 0, won: 0, streak: 0, bestStreak: 0, bestTime: null, ...readJSON(STATS_KEY, {}) };
let game = null;        // { deal, state, history, moves, elapsed, counted, won }
let selection = null;   // { from, n }
let busy = false;       // true while cards fly home automatically
let hintMarks = null;
let geo = null;

// ---------- Game lifecycle ----------
function newGame(dealNo) {
  abandon();
  game = { deal: dealNo, state: E.deal(dealNo), history: [], moves: 0, elapsed: 0, counted: false, won: false };
  selection = null; hideMessage(); save(); render(true);
  Sound.play('deal');
  runAuto();
}
function abandon() {
  if (game && game.counted && !game.won) { stats.streak = 0; saveStats(); }
}
const randomDeal = () => 1 + Math.floor(Math.random() * 32000);
function save() { if (game) write(SAVE_KEY, JSON.stringify({ ...game, history: game.history.slice(-300) })); }
function saveStats() { write(STATS_KEY, JSON.stringify(stats)); }
function load() {
  const param = Number(new URLSearchParams(location.search).get('deal'));
  const saved = readJSON(SAVE_KEY, null);
  if (Number.isInteger(param) && param >= 1 && param <= E.MAX_DEAL && (!saved || saved.deal !== param)) return newGame(param);
  if (saved && saved.state && Array.isArray(saved.state.cols) && saved.state.cols.length === 8) {
    game = { history: [], moves: 0, elapsed: 0, counted: false, won: false, ...saved };
    render(true);
    if (game.won) showWin();
    return;
  }
  newGame(randomDeal());
}

// ---------- Timer ----------
let tickStart = null;
const running = () => game && game.counted && !game.won && document.visibilityState === 'visible' && !paused;
let paused = false;
function syncTimer() {
  const now = performance.now();
  if (tickStart !== null) { game.elapsed += (now - tickStart) / 1000; tickStart = null; }
  if (running()) tickStart = now;
  $('#time').textContent = clock(game.elapsed);
}
setInterval(() => { if (game) { syncTimer(); } }, 1000);
const clock = (sec) => { sec = Math.floor(sec); const m = Math.floor(sec / 60); return `${m}:${String(sec % 60).padStart(2, '0')}`; };
function pause() { if (!game) return; paused = true; syncTimer(); save(); }
function resume() { if (!game) return; paused = false; syncTimer(); }
window.addEventListener('blur', pause);
window.addEventListener('pagehide', pause);
window.addEventListener('focus', resume);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resume(); else pause(); });

// ---------- Moves ----------
function doMove(m) {
  game.history.push({ state: E.clone(game.state), moves: game.moves });
  if (!game.counted) { game.counted = true; stats.played++; saveStats(); }
  paused = false;
  moveSound(m);
  game.state = E.apply(game.state, m);
  game.moves++;
  selection = null; clearHint(); hideMessage();
  syncTimer(); render();
  runAuto();
}
function runAuto() {
  const m = E.nextAutoMove(game.state);
  if (!m) { busy = false; afterMove(); return; }
  busy = true;
  setTimeout(() => { moveSound(m); game.state = E.apply(game.state, m); render(); runAuto(); }, 130);
}
function moveSound(m) {
  if (m.to.t === 'found') Sound.play('home', E.rank(E.cardsAt(game.state, m.from).at(-1)));
  else Sound.play(m.to.t === 'cell' ? 'cell' : 'move');
}
function afterMove() {
  save();
  if (E.isWon(game.state) && !game.won) {
    syncTimer();
    game.won = true;
    stats.won++; stats.streak++; stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    stats.bestTime = stats.bestTime === null ? Math.round(game.elapsed) : Math.min(stats.bestTime, Math.round(game.elapsed));
    saveStats(); save(); syncTimer(); render();
    setTimeout(() => { Sound.play('win'); showWin(); }, 450);
  } else if (E.isStuck(game.state)) showMessage(t().stuck);
}
function undo() {
  if (busy || !game.history.length) return;
  const prev = game.history.pop();
  game.state = prev.state; game.moves = prev.moves; game.won = false;
  Sound.play('undo');
  selection = null; clearHint(); hideMessage(); save(); render();
}
function tryMove(from, n, to) {
  let m = { from, n, to };
  if (to.t === 'col' && !game.state.cols[to.i].length && from.t === 'col') {
    m.n = Math.min(n, E.maxMovable(game.state, true));     // into an empty column: move as many as allowed
  }
  if (E.isLegal(game.state, m)) { doMove(m); return true; }
  if (to.t === 'col' && n > 1) {
    const max = E.maxMovable(game.state, !game.state.cols[to.i].length);
    const dest = game.state.cols[to.i];
    const first = E.cardsAt(game.state, from).at(-n);
    if (n > max && (!dest.length || E.stacks(first, dest.at(-1)))) showMessage(fmt(t().tooMany, { n: max }));
  }
  return false;
}

// ---------- Locating cards ----------
function locate(card) {
  const s = game.state;
  for (let i = 0; i < 8; i++) { const k = s.cols[i].indexOf(card); if (k >= 0) return { loc: { t: 'col', i }, index: k, n: s.cols[i].length - k }; }
  const c = s.cells.indexOf(card);
  if (c >= 0) return { loc: { t: 'cell', i: c }, index: 0, n: 1 };
  return { loc: { t: 'found', i: E.suit(card) }, index: 0, n: 0 };
}
function pickable(info) {
  if (info.loc.t === 'cell') return true;
  if (info.loc.t === 'col') return info.n <= E.runLength(game.state.cols[info.loc.i]);
  return false;
}
const same = (a, b) => a && b && a.t === b.t && a.i === b.i;

// ---------- Tap / click logic ----------
function onTap(target) {
  if (busy || !game || game.won) return;
  clearHint();
  const info = target.card !== undefined ? locate(target.card) : { loc: target.loc, n: 0 };
  if (selection) {
    if (same(info.loc, selection.from)) {
      // Tapped the selected pile again: send it to the best place.
      const best = E.bestMove(game.state, selection.from, selection.n);
      const sel = selection; selection = null;
      if (best) doMove(best); else { render(); shake(sel); }
      return;
    }
    const to = info.loc.t === 'found' ? { t: 'found', i: target.card !== undefined ? E.suit(target.card) : info.loc.i } : info.loc;
    const sel = selection;
    if (tryMove(sel.from, sel.n, to)) return;
    selection = null;
    if (target.card !== undefined && pickable(info) && info.loc.t !== 'found') { selection = { from: info.loc, n: info.n }; render(); return; }
    render(); shake(sel);
    return;
  }
  if (target.card !== undefined && pickable(info)) { selection = { from: info.loc, n: info.n }; Sound.play('pick'); render(); }
  else if (target.card !== undefined && info.loc.t === 'col') shake({ from: info.loc, n: info.n });
}
function shake(sel) {
  Sound.play('bad');
  for (const c of E.cardsAt(game.state, sel.from).slice(-sel.n)) {
    const el = cardEls[c]; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }
}

// ---------- Hints & messages ----------
function showHint() {
  if (busy || game.won) return;
  selection = null; clearHint();
  const m = E.hint(game.state);
  if (!m) { render(); showMessage(E.isStuck(game.state) ? t().stuck : t().noHint); return; }
  hintMarks = m; render();
  setTimeout(() => { if (hintMarks === m) { hintMarks = null; render(); } }, 1800);
}
function clearHint() { hintMarks = null; }
function showMessage(text) { const el = $('#message'); el.textContent = text; el.hidden = false; }
function hideMessage() { $('#message').hidden = true; }

// ---------- Board DOM ----------
const board = $('#board');
const slotEls = { cell: [], found: [], col: [] };
const cardEls = [];
function buildBoard() {
  for (let i = 0; i < 4; i++) slotEls.cell.push(slot('cell', i));
  for (let i = 0; i < 4; i++) {
    const s = slot('found', i);
    s.textContent = E.SUIT_SYMBOLS[i];
    if (i === 1 || i === 2) s.classList.add('red');
    slotEls.found.push(s);
  }
  for (let i = 0; i < 8; i++) slotEls.col.push(slot('col', i));
  const cellLabel = document.createElement('span'); cellLabel.className = 'slot-label'; cellLabel.dataset.t = 'cells';
  const foundLabel = document.createElement('span'); foundLabel.className = 'slot-label'; foundLabel.dataset.t = 'foundations';
  slotEls.cell[0].append(cellLabel); slotEls.found[FOUND_ORDER[0]].append(foundLabel);
  for (let c = 0; c < 52; c++) {
    const el = document.createElement('div');
    const r = E.rank(c);
    el.className = 'card' + (E.isRed(c) ? ' red' : '');
    el.dataset.card = c;
    const sym = E.SUIT_SYMBOLS[E.suit(c)];
    el.innerHTML = `<div class="corner"><span class="r">${E.RANK_LABELS[r]}</span><span class="s">${sym}</span></div>` +
      (r > 10 ? `<div class="face">${E.RANK_LABELS[r]}<small>${sym}</small></div>` : `<div class="pip">${sym}</div>`);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap({ card: c }); } });
    board.append(el);
    cardEls.push(el);
  }
}
function slot(type, i) {
  const el = document.createElement('div');
  el.className = `slot ${type}`;
  el.dataset.slot = type; el.dataset.i = i;
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap({ loc: { t: type, i } }); } });
  board.append(el);
  return el;
}

function computeGeometry() {
  const W = board.clientWidth;
  const narrow = W < 560;
  const pad = narrow ? 6 : Math.max(14, W * 0.02);
  const gap = narrow ? 4 : Math.max(8, W * 0.014);
  const cw = Math.min(112, Math.floor((W - 2 * pad - 7 * gap) / 8));
  const ch = Math.round(cw * 1.4);
  const left = (W - (8 * cw + 7 * gap)) / 2;
  const topY = pad + (narrow ? 0 : 20);
  const tabY = topY + ch + (narrow ? 12 : 24);
  const boardTop = board.getBoundingClientRect().top + window.scrollY;
  const avail = Math.max(window.innerHeight - boardTop - 24, tabY + ch * 3);
  return { W, narrow, pad, gap, cw, ch, left, topY, tabY, avail };
}
const colX = (i) => geo.left + i * (geo.cw + geo.gap);
function columnOffset(len) {
  const base = geo.ch * (geo.narrow ? 0.36 : 0.29), min = geo.ch * 0.18;
  if (len <= 1) return base;
  const room = geo.avail - geo.tabY - geo.ch - geo.pad;
  return Math.max(min, Math.min(base, room / (len - 1)));
}
function position(loc, index = 0) {
  if (loc.t === 'cell') return { x: colX(loc.i), y: geo.topY };
  if (loc.t === 'found') return { x: colX(4 + FOUND_ORDER.indexOf(loc.i)), y: geo.topY };
  return { x: colX(loc.i), y: geo.tabY + index * columnOffset(game.state.cols[loc.i].length) };
}

function render(instant = false) {
  if (!game) return;
  geo = computeGeometry();
  board.classList.toggle('narrow', geo.narrow);
  board.style.setProperty('--cw', `${geo.cw}px`);
  board.style.setProperty('--ch', `${geo.ch}px`);
  const s = game.state;
  let height = geo.tabY + geo.ch + geo.pad;
  for (let i = 0; i < 8; i++) height = Math.max(height, geo.tabY + (s.cols[i].length - 1) * columnOffset(s.cols[i].length) + geo.ch + geo.pad);
  board.style.height = `${Math.max(height, geo.avail)}px`;

  // Legal destinations for the current selection.
  const targets = new Set();
  if (selection) {
    const firstCell = s.cells.indexOf(null);
    for (const m of E.allMoves(s)) if (same(m.from, selection.from) && (m.to.t !== 'cell' || m.to.i === firstCell) && (m.n === selection.n || (m.to.t === 'col' && !s.cols[m.to.i].length))) targets.add(`${m.to.t}${m.to.i}`);
  }
  if (hintMarks) targets.add(`${hintMarks.to.t}${hintMarks.to.i}`);

  for (const type of ['cell', 'found', 'col']) slotEls[type].forEach((el, i) => {
    const p = position({ t: type, i }, 0);
    el.style.left = `${p.x}px`; el.style.top = `${p.y}px`;
    const empty = type === 'col' ? !s.cols[i].length : type === 'cell' ? s.cells[i] === null : s.found[i] === 0;
    el.classList.toggle('target', targets.has(`${type}${i}`) && empty);
    el.setAttribute('aria-label', type === 'cell' ? t().emptyCell : type === 'col' ? t().emptyCol : fmt(t().foundation, { s: t().suits[i] }));
  });

  const selected = new Set(selection ? E.cardsAt(s, selection.from).slice(-selection.n) : []);
  const hinted = new Set(hintMarks ? E.cardsAt(s, hintMarks.from).slice(-hintMarks.n) : []);
  const place = (card, loc, index, z) => {
    const el = cardEls[card];
    const p = position(loc, index);
    if (instant) el.style.transition = 'none';
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    el.style.zIndex = z;
    el.classList.toggle('selected', selected.has(card));
    el.classList.toggle('hint', hinted.has(card));
    const top = loc.t === 'col' ? index === s.cols[loc.i].length - 1 : true;
    el.classList.toggle('target', top && loc.t !== 'found' && targets.has(`${loc.t}${loc.i}`));
    const info = { loc, n: loc.t === 'col' ? s.cols[loc.i].length - index : 1 };
    el.tabIndex = loc.t !== 'found' && (pickable(info) || top) ? 0 : -1;
    el.setAttribute('aria-label', `${t().suits[E.suit(card)]} ${E.RANK_LABELS[E.rank(card)]}`);
    el.hidden = false;
  };
  // Foundations: show only the top two cards of each pile.
  for (let suitI = 0; suitI < 4; suitI++) {
    for (let r = 1; r <= 13; r++) {
      const card = (r - 1) * 4 + suitI;
      if (r <= s.found[suitI]) { place(card, { t: 'found', i: suitI }, 0, r); cardEls[card].hidden = r < s.found[suitI] - 1; }
    }
  }
  s.cells.forEach((card, i) => { if (card !== null) place(card, { t: 'cell', i }, 0, 20); });
  s.cols.forEach((col, i) => col.forEach((card, k) => place(card, { t: 'col', i }, k, 30 + k)));
  if (instant) { void board.offsetWidth; cardEls.forEach((el) => { el.style.transition = ''; }); }

  $('#moves').textContent = game.moves;
  $('#time').textContent = clock(game.elapsed);
  $('#deal-label').textContent = fmt(t().deal, { n: game.deal });
  $('#btn-undo').disabled = !game.history.length;
}

// ---------- Pointer input (tap + drag) ----------
let press = null;
board.addEventListener('pointerdown', (e) => {
  if (busy || !game || game.won || e.button > 0) return;
  resume();
  const cardEl = e.target.closest('.card');
  const slotEl = e.target.closest('.slot');
  if (!cardEl && !slotEl) { if (selection) { selection = null; render(); } return; }
  const target = cardEl ? { card: Number(cardEl.dataset.card) } : { loc: { t: slotEl.dataset.slot, i: Number(slotEl.dataset.i) } };
  press = { target, x: e.clientX, y: e.clientY, dragging: false, id: e.pointerId };
  if (cardEl) {
    const info = locate(target.card);
    if (pickable(info) && !selection) {
      press.info = info;
      press.cards = E.cardsAt(game.state, info.loc).slice(-info.n);
      press.origin = press.cards.map((c) => position(info.loc, info.loc.t === 'col' ? game.state.cols[info.loc.i].indexOf(c) : 0));
    }
  }
  board.setPointerCapture(e.pointerId);
});
board.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id || !press.cards) return;
  const dx = e.clientX - press.x, dy = e.clientY - press.y;
  if (!press.dragging && Math.hypot(dx, dy) < 8) return;
  if (!press.dragging) { press.dragging = true; selection = null; clearHint(); render(); }
  press.cards.forEach((c, k) => {
    const el = cardEls[c];
    el.classList.add('dragging');
    el.style.transform = `translate(${press.origin[k].x + dx}px, ${press.origin[k].y + dy}px)`;
    el.style.zIndex = 1000 + k;
  });
});
function endPress(e, cancelled) {
  if (!press || e.pointerId !== press.id) return;
  const p = press; press = null;
  if (p.dragging) {
    p.cards.forEach((c) => cardEls[c].classList.remove('dragging'));
    const to = cancelled ? null : dropTarget(e.clientX - p.x + p.origin[0].x + geo.cw / 2, e.clientY - p.y + p.origin[0].y + geo.ch / 2, p.info.loc);
    if (!to || !tryMove(p.info.loc, p.info.n, to)) { if (to) Sound.play('bad'); render(); }
  } else if (!cancelled) onTap(p.target);
}
board.addEventListener('pointerup', (e) => endPress(e, false));
board.addEventListener('pointercancel', (e) => endPress(e, true));

// Find the pile under the dragged card's centre (board coordinates).
function dropTarget(x, y, from) {
  let best = null, bestDist = Infinity;
  const consider = (loc, px, py, tall) => {
    if (same(loc, from)) return;
    const inX = x >= px - geo.gap / 2 && x <= px + geo.cw + geo.gap / 2;
    const inY = tall ? y >= py - geo.ch / 2 : y >= py - geo.ch / 2 && y <= py + geo.ch * 1.5;
    if (!inX || !inY) return;
    const d = Math.abs(x - (px + geo.cw / 2)) + (tall ? 0 : Math.abs(y - (py + geo.ch / 2)));
    if (d < bestDist) { bestDist = d; best = loc; }
  };
  for (let i = 0; i < 4; i++) { const p = position({ t: 'cell', i }); consider({ t: 'cell', i }, p.x, p.y, false); }
  for (let i = 0; i < 4; i++) { const p = position({ t: 'found', i }); consider({ t: 'found', i }, p.x, p.y, false); }
  if (y > geo.tabY - geo.ch / 2) for (let i = 0; i < 8; i++) consider({ t: 'col', i }, colX(i), geo.tabY, true);
  if (best && best.t === 'found') {
    // Any foundation drop goes to the pile for the card's own suit.
    const card = E.cardsAt(game.state, from).at(-1);
    best = { t: 'found', i: E.suit(card) };
  }
  return best;
}

// ---------- Language ----------
function applyLanguage() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t().title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
  $('#language').value = lang;
  board.setAttribute('aria-label', t().table);
  renderSound();
  renderStats();
  render();
}
$('#language').addEventListener('change', (e) => {
  if (!TEXT[e.target.value]) return;
  lang = e.target.value; write(LANG_KEY, lang); applyLanguage();
  if (!$('#message').hidden) hideMessage();
});

// ---------- Dialogs ----------
function renderStats() {
  const rows = [
    [t().played, stats.played], [t().won, stats.won], [t().streak, stats.streak],
    [t().bestTime, stats.bestTime === null ? '—' : clock(stats.bestTime)],
  ];
  $('#stats').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}
function confirmThen(text, okLabel, fn) {
  if (!game.counted || game.won) { fn(); return; }
  const dlg = $('#confirm');
  $('#confirm-text').textContent = text;
  $('#confirm-ok').textContent = okLabel;
  dlg.returnValue = '';
  dlg.onclose = () => { if (dlg.returnValue === 'ok') fn(); };
  dlg.showModal();
}
function showWin() {
  $('#win-text').textContent = fmt(t().winText, { n: game.deal, time: clock(game.elapsed), moves: game.moves, movesWord: game.moves === 1 ? 'move' : 'moves' });
  const dlg = $('#win');
  dlg.returnValue = '';
  dlg.onclose = () => { if (dlg.returnValue === 'new') newGame(randomDeal()); };
  if (!dlg.open) dlg.showModal();
}

$('#btn-new').addEventListener('click', () => confirmThen(t().confirmNew, t().newGame, () => newGame(randomDeal())));
$('#btn-restart').addEventListener('click', () => confirmThen(t().confirmRestart, t().restart, () => newGame(game.deal)));
$('#btn-undo').addEventListener('click', undo);
$('#btn-hint').addEventListener('click', showHint);
function renderSound() {
  const b = $('#btn-sound');
  b.textContent = `♪ ${soundOn ? t().soundOn : t().soundOff}`;
  b.setAttribute('aria-pressed', String(soundOn));
  b.classList.toggle('off', !soundOn);
}
$('#btn-sound').addEventListener('click', () => {
  soundOn = !soundOn; write(SOUND_KEY, soundOn ? 'on' : 'off');
  Sound.setEnabled(soundOn); renderSound();
  if (soundOn) setTimeout(() => Sound.play('move'), 30);
});
// Audio may only start after the player touches the page.
document.addEventListener('pointerdown', () => Sound.unlock(), true);
document.addEventListener('keydown', () => Sound.unlock(), true);
$('#btn-help').addEventListener('click', () => { renderStats(); $('#deal-input').value = game.deal; $('#help').showModal(); });
$('#btn-play-deal').addEventListener('click', () => {
  const n = Number($('#deal-input').value);
  if (!Number.isInteger(n) || n < 1 || n > E.MAX_DEAL) { $('#deal-input').setCustomValidity(t().badDeal); $('#deal-input').reportValidity(); return; }
  $('#deal-input').setCustomValidity('');
  $('#help').close();
  confirmThen(fmt(t().confirmDeal, { n }), t().ok, () => newGame(n));
});
$('#deal-input').addEventListener('input', (e) => e.target.setCustomValidity(''));
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  else if (e.key === 'Escape' && selection) { selection = null; render(); }
});

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(true), 80); });

buildBoard();
load();
applyLanguage();
syncTimer();
