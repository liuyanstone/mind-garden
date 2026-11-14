// Soft card sounds, synthesised with Web Audio (no sound files to download).
let audio = null;
let noise = null;
let enabled = true;

export function setEnabled(on) { enabled = on; if (on) unlock(); }

// Browsers only allow audio after the player has touched the page; call this from any tap or key press.
export function unlock() {
  if (!enabled) return;
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      noise = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.25), audio.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}

const ready = () => enabled && audio && audio.state === 'running';

// A short brushed "swish" like a card sliding onto the table.
function swish(at, { freq = 2400, dur = 0.09, vol = 0.32 } = {}) {
  const src = audio.createBufferSource();
  src.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.25, at);
  filter.frequency.exponentialRampToValueAtTime(freq * 0.7, at + dur);
  filter.Q.value = 0.9;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(at, Math.random() * 0.1);
  src.stop(at + dur + 0.02);
}
// A soft "tock" as the card lands.
function tap(at, freq = 190, vol = 0.18) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, at + 0.06);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
  osc.connect(gain).connect(audio.destination);
  osc.start(at); osc.stop(at + 0.09);
}
function bell(at, freq, vol = 0.09, dur = 0.35) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(at); osc.stop(at + dur + 0.02);
}

// Pentatonic steps so cards going home sound pleasant together; pitch rises with the card's rank.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
const note = (rank) => 523.25 * 2 ** (SCALE[Math.max(0, Math.min(12, rank - 1))] / 12);

export function play(kind, rank = 1) {
  if (!ready()) return;
  const now = audio.currentTime + 0.005;
  switch (kind) {
    case 'move': swish(now, { freq: 2200 + Math.random() * 500 }); tap(now + 0.05); break;
    case 'cell': swish(now, { freq: 2600, dur: 0.07 }); tap(now + 0.04, 230, 0.14); break;
    case 'home': swish(now, { freq: 3000, dur: 0.07, vol: 0.24 }); bell(now + 0.04, note(rank)); break;
    case 'pick': tap(now, 320, 0.08); break;
    case 'undo': swish(now, { freq: 1600, dur: 0.1, vol: 0.26 }); tap(now + 0.06, 150, 0.12); break;
    case 'bad': tap(now, 120, 0.2); tap(now + 0.09, 105, 0.16); break;
    case 'deal': for (let i = 0; i < 8; i++) swish(now + i * 0.045, { freq: 2000 + i * 120, dur: 0.06, vol: 0.2 }); break;
    case 'win': [0, 4, 7, 12, 16].forEach((s, i) => bell(now + i * 0.12, 523.25 * 2 ** (s / 12), 0.1, 0.6)); break;
    default: break;
  }
}
