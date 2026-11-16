import * as L from './layout.mjs?v=4';

const TEXT = {
  zh: {
    title: '花园小火车 · Garden Rails', name: '花园小火车', language: '语言',
    trainsLeft: '剩余火车', level: '难度', correct: '送对', score: '得分',
    eyebrow: '每局 25 列火车 · 专注与分配注意', startTitle: '把小火车送回家',
    rule1: '彩色小火车会不断从山洞里开出来，每列车都要回到同样颜色、同样图案的小屋。',
    rule2: '点一下轨道上的圆形道岔，就能切换它指向的方向。火车经过道岔时，会沿着箭头走。',
    rule3: '每局共 25 列火车，全部到站就结束。难度越高，颜色越多、铁轨越长，同时在跑的火车也越多。可以选“自动”，也可以自己挑难度。',
    planDaily: '今天第一局：随机难度 <b>Lv {level}</b>（{colors} 种颜色）',
    planAdaptive: '根据最近三局的平均表现：<b>Lv {level}</b>（{colors} 种颜色）',
    planNew: '第一次玩：从 <b>Lv {level}</b> 开始（{colors} 种颜色）',
    planManual: '你选择的难度：<b>Lv {level}</b>（{colors} 种颜色）',
    chooseLevel: '难度', autoOption: '自动（推荐）', levelOption: 'Lv {level} · {colors} 种颜色',
    nextManual: '下一局：<b>Lv {level}</b>（{colors} 种颜色）· 你选择的难度',
    start: '开始', pausedTitle: '已暂停', resume: '继续', pause: '暂停',
    soundOn: '声音开', soundOff: '声音关',
    timeUp: '本局完成', timeUsed: '用时', recentTitle: '最近三局', again: '再玩一局',
    great: '太棒了！', good: '很不错！', fine: '稳稳当当', keep: '慢慢来，下次会更好',
    accuracy: '正确率', todayBest: '今日最高', trains: '送对 / 到站',
    nextUp: '下一局：<b>Lv {level}</b>（{colors} 种颜色）· {why}',
    whyUp: '最近的平均表现很好，难度提高', whyDown: '最近有点吃力，难度降低一些', whySame: '保持当前难度',
    recentRow: 'Lv {level} · {correct}/{total} · {acc}', railway: '铁路',
    colorNames: ['番茄红', '湖蓝', '向日葵黄', '叶绿', '葡萄紫', '橘橙', '桃粉', '青碧'],
  },
  en: {
    title: 'Garden Rails · 花园小火车', name: 'Garden Rails', language: 'Language',
    trainsLeft: 'Trains left', level: 'Level', correct: 'Correct', score: 'Score',
    eyebrow: '25 TRAINS A ROUND · FOCUS & SPLIT ATTENTION', startTitle: 'Bring every train home',
    rule1: 'Colourful trains keep rolling out of the tunnel. Each one must reach the house with the same colour and symbol.',
    rule2: 'Tap a round switch on the track to flip its direction. Trains follow the arrow as they pass.',
    rule3: 'Each round has 25 trains and ends when they have all arrived. Higher levels bring more colours, longer tracks and more trains running at the same time. Choose Auto, or pick a level yourself.',
    planDaily: 'First round today: random level <b>Lv {level}</b> ({colors} colours)',
    planAdaptive: 'Based on your last three rounds: <b>Lv {level}</b> ({colors} colours)',
    planNew: 'First time here: starting at <b>Lv {level}</b> ({colors} colours)',
    planManual: 'Your chosen level: <b>Lv {level}</b> ({colors} colours)',
    chooseLevel: 'Level', autoOption: 'Auto (recommended)', levelOption: 'Lv {level} · {colors} colours',
    nextManual: 'Next round: <b>Lv {level}</b> ({colors} colours) · your chosen level',
    start: 'Start', pausedTitle: 'Paused', resume: 'Resume', pause: 'Pause',
    soundOn: 'Sound on', soundOff: 'Sound off',
    timeUp: 'ROUND COMPLETE', timeUsed: 'Time', recentTitle: 'Last three rounds', again: 'Play again',
    great: 'Wonderful!', good: 'Nicely done!', fine: 'Steady work', keep: 'Take it easy — next time will be better',
    accuracy: 'Accuracy', todayBest: "Today's best", trains: 'Correct / arrived',
    nextUp: 'Next round: <b>Lv {level}</b> ({colors} colours) · {why}',
    whyUp: 'your recent average is strong, so it gets harder', whyDown: 'recent rounds were tough, so it gets a little easier', whySame: 'staying at this level',
    recentRow: 'Lv {level} · {correct}/{total} · {acc}', railway: 'Railway',
    colorNames: ['Tomato', 'Lake blue', 'Sunflower', 'Leaf green', 'Grape', 'Orange', 'Peach pink', 'Teal'],
  },
};
const COLORS = ['#d4553a', '#3f7cc0', '#e2ad2f', '#4f9a5a', '#8a63b8', '#ec8a3a', '#de6fa0', '#2a9d97'];
const DARK = ['#9c3a25', '#2a5788', '#a77a12', '#336a3c', '#5f4285', '#ad5c1d', '#a5476f', '#1b6c67'];

const $ = (s) => document.querySelector(s);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const readJSON = (k, d) => { try { return JSON.parse(read(k)) ?? d; } catch { return d; } };
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
const pct = (x) => `${Math.round(x * 100)}%`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

const KEYS = { lang: 'garden-rails-language', sound: 'garden-rails-sound', history: 'garden-rails-history', day: 'garden-rails-day', choice: 'garden-rails-choice' };
let lang = read(KEYS.lang) || (/^zh/i.test(navigator.language) ? 'zh' : 'en');
if (!TEXT[lang]) lang = 'zh';
const t = () => TEXT[lang];
let soundOn = read(KEYS.sound) !== 'off';

// ---------- Level plan ----------
let history = readJSON(KEYS.history, []);
if (!Array.isArray(history)) history = [];
// Levels were renumbered (old Lv 1–3 removed, old Lv 4 is now Lv 1). Shift saved levels once to match.
if (read('garden-rails-scale') !== '2') {
  const shift = (n) => Math.max(1, Math.min(L.MAX_LEVEL, Number(n) - 3));
  history = history.map((g) => ({ ...g, level: shift(g.level), rating: shift(g.rating) }));
  write(KEYS.history, JSON.stringify(history));
  const oldChoice = read(KEYS.choice);
  if (oldChoice && oldChoice !== 'auto') write(KEYS.choice, String(shift(oldChoice)));
  try { localStorage.removeItem(KEYS.day); } catch { /* storage unavailable */ }
  write('garden-rails-scale', '2');
}
function dayRecord() {
  let d = readJSON(KEYS.day, null);
  if (!d || d.date !== today()) {
    d = { date: today(), played: 0, best: 0, randomLevel: L.randomDailyLevel(history) };
    write(KEYS.day, JSON.stringify(d));
  }
  return d;
}
let choice = read(KEYS.choice) || 'auto';
if (choice !== 'auto' && !(Number(choice) >= 1 && Number(choice) <= L.MAX_LEVEL)) choice = 'auto';
function plan() {
  if (choice !== 'auto') return { level: Number(choice), why: 'manual' };
  const d = dayRecord();
  if (d.played === 0) return { level: d.randomLevel, why: history.length ? 'daily' : 'new' };
  return { level: L.adaptiveLevel(history), why: 'adaptive' };
}

// ---------- Game state ----------
let cfg, layout, S = 40, portrait = false;
let phase = 'ready'; // ready | countdown | playing | paused | over
let elapsed = 0, countdown = 0, spawnIn = 0, correct = 0, total = 0, score = 0, spawned = 0, endIn = null;
let trains = [], effects = [], recentColors = [];
let currentPlan = null;

const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
const staticLayer = document.createElement('canvas');
const sctx = staticLayer.getContext('2d');
const stage = $('#stage');

function prepare() {
  currentPlan = plan();
  cfg = L.levelConfig(currentPlan.level);
  portrait = stage.clientWidth < 640 && window.innerHeight > window.innerWidth;
  layout = L.generate(cfg, portrait);
  trains = []; effects = []; recentColors = [];
  elapsed = 0; correct = 0; total = 0; score = 0;
  spawnIn = 0.6; spawned = 0; endIn = null;
  resize();
  renderPlan();
  updateHud();
}

// ---------- Sizing & static drawing ----------
function resize() {
  if (!layout) return;
  const top = stage.getBoundingClientRect().top + window.scrollY;
  const availH = Math.max(280, window.innerHeight - top - 16);
  const availW = stage.clientWidth;
  S = Math.floor(Math.min(availW / layout.w, availH / layout.h, 92));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const c of [canvas, staticLayer]) { c.width = Math.round(S * layout.w * dpr); c.height = Math.round(S * layout.h * dpr); }
  canvas.style.width = `${S * layout.w}px`;
  canvas.style.height = `${S * layout.h}px`;
  fitStage();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawStatic();
  draw();
}

const cx = (n) => (n.x + 0.5) * S;
const cy = (n) => (n.y + 0.5) * S;

// Make the play area tall enough for whichever panel is showing (start or results), so nothing gets cut off.
function fitStage() {
  if (!layout) return;
  const panel = stage.querySelector('.overlay:not([hidden]) .panel');
  stage.style.minHeight = `${Math.max(S * layout.h, panel ? panel.scrollHeight + 32 : 0)}px`;
}

function drawStatic() {
  const c = sctx;
  c.clearRect(0, 0, S * layout.w, S * layout.h);
  c.fillStyle = '#e3e9d6';
  c.fillRect(0, 0, S * layout.w, S * layout.h);
  // Soft grass tufts on empty cells.
  const used = new Set(layout.nodes.map((n) => `${n.x},${n.y}`));
  const rnd = L.seeded(layout.w * 31 + layout.h);
  for (let y = 0; y < layout.h; y++) for (let x = 0; x < layout.w; x++) {
    if (used.has(`${x},${y}`) || rnd() > 0.28) continue;
    const px = (x + 0.2 + rnd() * 0.6) * S, py = (y + 0.3 + rnd() * 0.5) * S;
    c.strokeStyle = '#c3d1b1'; c.lineWidth = Math.max(1.5, S * 0.04); c.lineCap = 'round';
    c.beginPath(); c.moveTo(px - S * 0.08, py); c.lineTo(px - S * 0.12, py - S * 0.12);
    c.moveTo(px, py); c.lineTo(px, py - S * 0.16); c.moveTo(px + S * 0.08, py); c.lineTo(px + S * 0.12, py - S * 0.12); c.stroke();
    if (rnd() < 0.3) { c.fillStyle = rnd() < 0.5 ? '#e7b9c0' : '#f0d48a'; c.beginPath(); c.arc(px + S * 0.18, py - S * 0.1, S * 0.05, 0, 7); c.fill(); }
  }
  // Track segments (all are one cell long and horizontal or vertical).
  const segs = layout.nodes.filter((n) => n.parent).map((n) => [n.parent, n]);
  for (const [a, b] of segs) {           // sleepers
    const horiz = a.y === b.y;
    c.fillStyle = '#c5b28a';
    for (let k = 0; k <= 3; k++) {
      const f = k / 3, x = cx(a) + (cx(b) - cx(a)) * f, y = cy(a) + (cy(b) - cy(a)) * f;
      if (horiz) c.fillRect(x - S * 0.04, y - S * 0.22, S * 0.08, S * 0.44); else c.fillRect(x - S * 0.22, y - S * 0.04, S * 0.44, S * 0.08);
    }
  }
  c.strokeStyle = '#8c7a5c'; c.lineWidth = Math.max(2, S * 0.055); c.lineCap = 'round';
  for (const [a, b] of segs) {            // rails
    const horiz = a.y === b.y, o = S * 0.13;
    c.beginPath();
    if (horiz) { c.moveTo(cx(a), cy(a) - o); c.lineTo(cx(b), cy(b) - o); c.moveTo(cx(a), cy(a) + o); c.lineTo(cx(b), cy(b) + o); }
    else { c.moveTo(cx(a) - o, cy(a)); c.lineTo(cx(b) - o, cy(b)); c.moveTo(cx(a) + o, cy(a)); c.lineTo(cx(b) + o, cy(b)); }
    c.stroke();
  }
  // Rail joints at corners and switches look tidier with a small plate.
  c.fillStyle = '#d9cba6';
  for (const n of layout.nodes) if (n.type === 'track' && n.parent && n.children[0] && (n.parent.x === n.children[0].x) === false && (n.parent.y === n.children[0].y) === false) {
    c.beginPath(); c.arc(cx(n), cy(n), S * 0.2, 0, 7); c.fill();
  }
  drawTunnel(c, layout.tunnel);
  for (const s of layout.stations) drawHouse(c, s, false);
}

function drawTunnel(c, n) {
  const child = n.children[0];
  const ang = Math.atan2(child.y - n.y, child.x - n.x);
  c.save(); c.translate(cx(n), cy(n)); c.rotate(ang);
  c.fillStyle = '#a9bb97'; c.beginPath(); c.arc(0, 0, S * 0.47, 0, 7); c.fill();
  c.fillStyle = '#93a882'; c.beginPath(); c.ellipse(-S * 0.12, -S * 0.12, S * 0.22, S * 0.18, 0, 0, 7); c.fill();
  c.fillStyle = '#3f4d42';
  c.beginPath(); c.moveTo(S * 0.42, -S * 0.26); c.lineTo(S * 0.05, -S * 0.26);
  c.arc(S * 0.05, 0, S * 0.26, -Math.PI / 2, Math.PI / 2, true); c.lineTo(S * 0.42, S * 0.26); c.closePath(); c.fill();
  c.restore();
}

function drawHouse(c, s, flash) {
  const x = cx(s), y = cy(s), w = S * 0.84, col = s.color;
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(38,62,53,.12)'; c.beginPath(); c.ellipse(0, w * 0.48, w * 0.5, w * 0.1, 0, 0, 7); c.fill();
  c.fillStyle = flash || COLORS[col];
  roundRect(c, -w * 0.42, -w * 0.12, w * 0.84, w * 0.58, w * 0.08); c.fill();
  c.fillStyle = DARK[col];
  c.beginPath(); c.moveTo(-w * 0.52, -w * 0.08); c.lineTo(0, -w * 0.52); c.lineTo(w * 0.52, -w * 0.08); c.closePath(); c.fill();
  c.fillStyle = '#fffdf7';
  drawSymbol(c, col, 0, w * 0.17, w * 0.17);
  c.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// Each colour also has its own symbol, so colours never have to be told apart by hue alone.
function drawSymbol(c, i, x, y, r) {
  c.beginPath();
  switch (i) {
    case 0: c.arc(x, y, r * 0.85, 0, 7); break;
    case 1: c.moveTo(x, y - r); c.lineTo(x + r * 0.95, y + r * 0.75); c.lineTo(x - r * 0.95, y + r * 0.75); c.closePath(); break;
    case 2: c.rect(x - r * 0.78, y - r * 0.78, r * 1.56, r * 1.56); break;
    case 3: for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); break;
    case 4: c.moveTo(x, y + r * 0.85); c.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.4);
      c.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.85); break;
    case 5: c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); break;
    case 6: for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4 - Math.PI / 2; c.moveTo(x + Math.cos(a) * r * 0.55 + r * 0.42, y + Math.sin(a) * r * 0.55); c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, 0, 7); } break;
    default: c.arc(x, y, r * 0.9, Math.PI * 0.35, Math.PI * 1.65); c.arc(x + r * 0.45, y - r * 0.1, r * 0.7, Math.PI * 1.45, Math.PI * 0.55, true); c.closePath();
  }
  c.fill();
}

// ---------- Per-frame drawing ----------
function draw() {
  if (!layout) return;
  const W = S * layout.w, H = S * layout.h;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(staticLayer, 0, 0, W, H);
  for (const fx of effects) if (fx.house && fx.age < 0.5) drawHouse(ctx, fx.house, fx.ok ? null : '#c9c4b8');
  for (const s of layout.switches) drawSwitch(s);
  for (const tr of trains) drawTrain(tr);
  for (const fx of effects) drawEffect(fx);
}

function drawSwitch(n) {
  const a = n.children[n.state];
  const dx = a.x - n.x, dy = a.y - n.y;
  ctx.strokeStyle = '#345c43'; ctx.lineWidth = S * 0.15; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx(n), cy(n)); ctx.lineTo(cx(n) + dx * S * 0.55, cy(n) + dy * S * 0.55); ctx.stroke();
  const pulse = effects.find((f) => f.sw === n);
  const r = S * 0.3 * (pulse ? 1 + 0.15 * (1 - pulse.age / 0.25) : 1);
  ctx.fillStyle = '#fffdf7'; ctx.strokeStyle = '#345c43'; ctx.lineWidth = Math.max(2, S * 0.06);
  ctx.beginPath(); ctx.arc(cx(n), cy(n), r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(cx(n), cy(n)); ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = '#345c43';
  ctx.beginPath(); ctx.moveTo(r * 0.62, 0); ctx.lineTo(-r * 0.3, -r * 0.5); ctx.lineTo(-r * 0.1, 0); ctx.lineTo(-r * 0.3, r * 0.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawTrain(tr) {
  const x = (tr.from.x + (tr.to.x - tr.from.x) * tr.t + 0.5) * S;
  const y = (tr.from.y + (tr.to.y - tr.from.y) * tr.t + 0.5) * S;
  const target = Math.atan2(tr.to.y - tr.from.y, tr.to.x - tr.from.x);
  let diff = target - tr.prevAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const angle = tr.prevAngle + diff * Math.min(1, tr.t / 0.35);
  const len = S * 0.7, wid = S * 0.46;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = 'rgba(38,62,53,.18)'; roundRect(ctx, -len / 2 + 2, -wid / 2 + 3, len, wid, wid * 0.3); ctx.fill();
  ctx.fillStyle = COLORS[tr.color]; roundRect(ctx, -len / 2, -wid / 2, len, wid, wid * 0.3); ctx.fill();
  ctx.fillStyle = DARK[tr.color]; roundRect(ctx, len * 0.18, -wid / 2, len * 0.32, wid, wid * 0.3); ctx.fill();
  ctx.fillStyle = '#fdf6df'; ctx.beginPath(); ctx.arc(len / 2 - wid * 0.06, -wid * 0.26, wid * 0.08, 0, 7); ctx.arc(len / 2 - wid * 0.06, wid * 0.26, wid * 0.08, 0, 7); ctx.fill();
  ctx.rotate(-angle);
  ctx.fillStyle = '#fffdf7'; drawSymbol(ctx, tr.color, -len * 0.08 * Math.cos(angle), -len * 0.08 * Math.sin(angle), wid * 0.27);
  ctx.restore();
}

function drawEffect(fx) {
  if (fx.sw) return;
  const k = fx.age / fx.life;
  const x = cx(fx.house), y = cy(fx.house) - S * 0.55 - k * S * 0.4;
  ctx.globalAlpha = 1 - k;
  ctx.fillStyle = fx.ok ? '#345c43' : '#b94e2c';
  ctx.beginPath(); ctx.arc(x, y, S * 0.24, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fffdf7'; ctx.lineWidth = S * 0.06; ctx.lineCap = 'round';
  ctx.beginPath();
  if (fx.ok) { ctx.moveTo(x - S * 0.1, y); ctx.lineTo(x - S * 0.02, y + S * 0.08); ctx.lineTo(x + S * 0.11, y - S * 0.08); }
  else { ctx.moveTo(x - S * 0.08, y - S * 0.08); ctx.lineTo(x + S * 0.08, y + S * 0.08); ctx.moveTo(x + S * 0.08, y - S * 0.08); ctx.lineTo(x - S * 0.08, y + S * 0.08); }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- Simulation ----------
function pickColor() {
  let c;
  do { c = Math.floor(Math.random() * cfg.colors); }
  while (recentColors.length >= 2 && recentColors.at(-1) === c && recentColors.at(-2) === c);
  recentColors.push(c); if (recentColors.length > 4) recentColors.shift();
  return c;
}
function update(dt) {
  if (phase === 'countdown') {
    countdown -= dt;
    $('#count-num').textContent = Math.max(1, Math.ceil(countdown));
    if (countdown <= 0) { phase = 'playing'; $('#countdown').hidden = true; $('#btn-pause').hidden = false; }
  }
  for (const fx of effects) fx.age += dt;
  effects = effects.filter((fx) => fx.age < fx.life);
  if (phase !== 'playing') return;

  elapsed += dt;
  spawnIn -= dt;
  const exitClear = !trains.some((tr) => tr.dist < 1.15);
  if (spawnIn <= 0 && exitClear && spawned < L.TRAINS_PER_ROUND) {
    spawned++;
    const first = layout.tunnel.children[0];
    trains.push({ color: pickColor(), from: layout.tunnel, to: first, t: 0, dist: 0, prevAngle: Math.atan2(first.y - layout.tunnel.y, first.x - layout.tunnel.x) });
    spawnIn = cfg.interval * (0.85 + Math.random() * 0.3);
  }
  const step = cfg.speed * dt;
  for (const tr of trains) {
    tr.t += step; tr.dist += step;
    while (tr.t >= 1 && !tr.done) {
      tr.t -= 1;
      const at = tr.to;
      if (at.type === 'station') { arrive(tr, at); break; }
      tr.prevAngle = Math.atan2(at.y - tr.from.y, at.x - tr.from.x);
      tr.from = at; tr.to = L.nextNode(at);
    }
  }
  trains = trains.filter((tr) => !tr.done);
  // The round ends shortly after the last of the 25 trains reaches a house.
  if (endIn === null && total >= L.TRAINS_PER_ROUND) endIn = 0.8;
  if (endIn !== null && (endIn -= dt) <= 0) finish();
  updateHud();
}
function arrive(tr, house) {
  tr.done = true;
  total++;
  const ok = house.color === tr.color;
  if (ok) { correct++; score += cfg.points; }
  effects.push({ house, ok, age: 0, life: 0.9 });
  sound(ok ? 'good' : 'bad');
}

// ---------- Input ----------
canvas.addEventListener('pointerdown', (e) => {
  if (phase !== 'playing' && phase !== 'countdown') return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / S, y = (e.clientY - rect.top) / S;
  let best = null, bestD = 0.9;
  for (const s of layout.switches) {
    const d = Math.hypot(s.x + 0.5 - x, s.y + 0.5 - y);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!best) return;
  e.preventDefault();
  best.state = 1 - best.state;
  effects.push({ sw: best, age: 0, life: 0.25 });
  sound('click');
});

// ---------- Round flow ----------
function startRound() {
  ensureAudio();
  if (phase === 'over') prepare();
  $('#start').hidden = true; $('#result').hidden = true;
  phase = 'countdown'; countdown = 3;
  $('#count-num').textContent = '3';
  fitStage();
  $('#countdown').hidden = false;
}
function pause() {
  if (phase !== 'playing' && phase !== 'countdown') return;
  phase = 'paused';
  $('#paused').hidden = false; $('#btn-pause').hidden = true;
}
function resume() {
  if (phase !== 'paused') return;
  $('#paused').hidden = true;
  phase = 'countdown'; countdown = Math.max(countdown, 0) > 0 ? countdown : 1.5;
  $('#countdown').hidden = false;
}
function finish() {
  phase = 'over';
  $('#btn-pause').hidden = true;
  const acc = total ? correct / total : 0;
  const entry = { date: today(), level: cfg.level, correct, total, score, seconds: Math.round(elapsed), accuracy: +acc.toFixed(3), rating: L.rating(cfg.level, acc) };
  history.push(entry);
  history = history.slice(-30);
  write(KEYS.history, JSON.stringify(history));
  const d = dayRecord();
  d.played++; d.best = Math.max(d.best || 0, score);
  write(KEYS.day, JSON.stringify(d));
  showResult(entry, d);
  sound('end');
}

function showResult(entry, d) {
  const acc = entry.accuracy;
  $('#result-title').textContent = acc >= 0.92 ? t().great : acc >= 0.8 ? t().good : acc >= 0.65 ? t().fine : t().keep;
  const cells = [
    [t().score, entry.score], [t().trains, `${entry.correct} / ${entry.total}`],
    [t().accuracy, pct(acc)], [t().timeUsed, clock(entry.seconds ?? 0)], [t().todayBest, d.best],
  ];
  $('#result-grid').innerHTML = cells.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
  renderNext(entry);
  $('#recent').innerHTML = history.slice(-3).reverse().map((g) =>
    `<li><span>${fmt(t().recentRow, { level: g.level, correct: g.correct, total: g.total, acc: pct(g.accuracy) })}</span><b>${g.score}</b></li>`).join('');
  $('#result').hidden = false;
  fitStage();
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
function renderNext(entry) {
  const next = plan().level;
  if (choice !== 'auto') { $('#result-next').innerHTML = fmt(t().nextManual, { level: next, colors: L.levelConfig(next).colors }); return; }
  const why = next > entry.level ? t().whyUp : next < entry.level ? t().whyDown : t().whySame;
  $('#result-next').innerHTML = fmt(t().nextUp, { level: next, colors: L.levelConfig(next).colors, why });
}

// Level picker (on the start and result panels): "Auto" or a fixed level.
function renderLevelSelects() {
  const opts = [`<option value="auto">${t().autoOption}</option>`,
    ...Array.from({ length: L.MAX_LEVEL }, (_, i) => `<option value="${i + 1}">${fmt(t().levelOption, { level: i + 1, colors: L.levelConfig(i + 1).colors })}</option>`)].join('');
  document.querySelectorAll('.level-select').forEach((sel) => { sel.innerHTML = opts; sel.value = choice; });
}
document.querySelectorAll('.level-select').forEach((sel) => sel.addEventListener('change', () => {
  choice = sel.value;
  write(KEYS.choice, choice);
  document.querySelectorAll('.level-select').forEach((other) => { other.value = choice; });
  if (phase === 'ready') prepare();
  else if (phase === 'over' && history.length) renderNext(history.at(-1));
}));

function renderPlan() {
  if (!currentPlan) return;
  const key = { daily: 'planDaily', new: 'planNew', manual: 'planManual' }[currentPlan.why] || 'planAdaptive';
  $('#plan').innerHTML = fmt(t()[key], { level: cfg.level, colors: cfg.colors });
}
function updateHud() {
  const left = Math.max(0, L.TRAINS_PER_ROUND - total);
  $('#hud-left').textContent = left;
  $('#hud-level').textContent = `Lv ${cfg.level}`;
  $('#hud-correct').textContent = `${correct} / ${total}`;
  $('#hud-score').textContent = score;
  $('#progress').style.transform = `scaleX(${left / L.TRAINS_PER_ROUND})`;
}

// ---------- Sound ----------
let audio = null;
function ensureAudio() {
  if (!audio && soundOn) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } }
  if (audio && audio.state === 'suspended') audio.resume();
}
function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, audio.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, audio.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + dur);
  o.connect(g).connect(audio.destination);
  o.start(audio.currentTime + start); o.stop(audio.currentTime + start + dur + 0.02);
}
function sound(kind) {
  if (!soundOn || !audio) return;
  if (kind === 'good') { tone(660, 0, 0.12); tone(880, 0.08, 0.16); }
  else if (kind === 'bad') tone(220, 0, 0.25, 'triangle', 0.14);
  else if (kind === 'click') tone(1200, 0, 0.04, 'square', 0.04);
  else if (kind === 'end') { tone(523, 0, 0.15); tone(659, 0.12, 0.15); tone(784, 0.24, 0.25); }
}
function renderSound() {
  $('#btn-sound').innerHTML = `<span aria-hidden="true" class="note">♪</span> <span class="label">${soundOn ? t().soundOn : t().soundOff}</span>`;
  $('#btn-sound').setAttribute('aria-label', soundOn ? t().soundOn : t().soundOff);
  $('#btn-sound').setAttribute('aria-pressed', String(soundOn));
  $('#btn-sound').classList.toggle('off', !soundOn);
}
$('#btn-sound').addEventListener('click', () => { soundOn = !soundOn; write(KEYS.sound, soundOn ? 'on' : 'off'); if (soundOn) ensureAudio(); renderSound(); });

// ---------- Language ----------
function applyLanguage() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t().title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
  $('#language').value = lang;
  $('#btn-pause').textContent = t().pause;
  canvas.setAttribute('aria-label', t().railway);
  renderSound();
  renderLevelSelects();
  renderPlan();
  fitStage();
  if (phase === 'over' && history.length) showResult(history.at(-1), dayRecord());
}
$('#language').addEventListener('change', (e) => { if (TEXT[e.target.value]) { lang = e.target.value; write(KEYS.lang, lang); applyLanguage(); } });

// ---------- Wiring ----------
$('#btn-start').addEventListener('click', startRound);
$('#btn-again').addEventListener('click', startRound);
$('#btn-resume').addEventListener('click', resume);
$('#btn-pause').addEventListener('click', pause);
window.addEventListener('blur', pause);
window.addEventListener('pagehide', pause);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pause(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'p') { if (phase === 'paused') resume(); else pause(); }
});
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

prepare();
applyLanguage();
window.addEventListener('load', fitStage);
requestAnimationFrame(frame);

// Small hook for automated checks.
window.__gardenRails = { get state() { return { phase, elapsed, correct, total, score, level: cfg.level, trains: trains.length, switches: layout.switches.length }; }, layout: () => layout, trains: () => trains, step(sec) { for (let i = 0; i < sec * 50; i++) update(0.02); draw(); } };
