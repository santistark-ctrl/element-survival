// Audio sintetizado con WebAudio (sin archivos): efectos por elemento y
// música secuenciada con intensidad variable.
import { familyOf } from './data/elements.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Acordes (notas MIDI) para la música: i - VI - III - VII en La menor.
const PROGRESSION = [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]];
const MENU_MELODY = [69, 72, 76, 72, 74, 72, 69, 67, 69, 72, 76, 79, 76, 74, 72, 69];
const GAME_ARP = [0, 1, 2, 1, 0, 2, 1, 2];

const SFX = {
  pickup:     [{ f: 900, f2: 1500, t: 'sine', d: 0.09, g: 0.12 }],
  pickupBig:  [{ f: 660, f2: 1320, t: 'sine', d: 0.14, g: 0.16 }, { f: 990, f2: 1980, t: 'sine', d: 0.18, g: 0.12, delay: 0.07 }],
  coin:       [{ f: 1320, f2: 1600, t: 'triangle', d: 0.07, g: 0.1 }, { f: 1760, t: 'triangle', d: 0.1, g: 0.08, delay: 0.06 }],
  hurt:       [{ f: 150, f2: 60, t: 'sawtooth', d: 0.2, g: 0.28, filter: { type: 'lowpass', f: 800 } }, { noise: true, d: 0.12, g: 0.2, filter: { type: 'lowpass', f: 600 } }],
  select:     [{ f: 520, f2: 640, t: 'sine', d: 0.05, g: 0.12 }],
  hover:      [{ f: 380, t: 'sine', d: 0.03, g: 0.05 }],
  levelup:    [523, 659, 784, 1047, 1319].map((f, i) => ({ f, t: 'triangle', d: 0.22, g: 0.18, delay: i * 0.08 })),
  chest:      [659, 880, 1175, 1568, 2093].map((f, i) => ({ f, t: 'sine', d: 0.25, g: 0.16, delay: i * 0.09 })),
  synergy:    [392, 523, 659, 784, 1047, 1319].map((f, i) => ({ f, t: 'triangle', d: 0.25, g: 0.16, delay: i * 0.07 })),
  element:    [330, 415, 494, 659].map((f, i) => ({ f, t: 'sine', d: 0.3, g: 0.16, delay: i * 0.1 })),
  boss:       [{ f: 55, f2: 40, t: 'sawtooth', d: 1.1, g: 0.35, filter: { type: 'lowpass', f: 400 } }, { f: 82, t: 'sawtooth', d: 1.0, g: 0.22, delay: 0.3, filter: { type: 'lowpass', f: 500 } }, { noise: true, d: 0.8, g: 0.15, filter: { type: 'lowpass', f: 300 } }],
  bossDead:   [220, 330, 440, 660, 880, 1320].map((f, i) => ({ f, t: 'square', d: 0.28, g: 0.12, delay: i * 0.09 })),
  eliteDead:  [{ f: 300, f2: 900, t: 'square', d: 0.18, g: 0.1 }, { noise: true, d: 0.25, g: 0.15, filter: { type: 'lowpass', f: 900 } }],
  revive:     [{ f: 262, f2: 1047, t: 'sine', d: 0.7, g: 0.28 }, { f: 523, f2: 2093, t: 'triangle', d: 0.6, g: 0.15, delay: 0.15 }],
  explode:    [{ f: 90, f2: 30, t: 'sawtooth', d: 0.25, g: 0.2, filter: { type: 'lowpass', f: 500 } }, { noise: true, d: 0.3, g: 0.25, filter: { type: 'lowpass', f: 700 } }],
  horde:      [{ f: 110, t: 'square', d: 0.3, g: 0.18, filter: { type: 'lowpass', f: 600 } }, { f: 110, t: 'square', d: 0.3, g: 0.18, delay: 0.35, filter: { type: 'lowpass', f: 600 } }, { f: 147, t: 'square', d: 0.5, g: 0.18, delay: 0.7, filter: { type: 'lowpass', f: 700 } }],
  enemyShot:  [{ f: 400, f2: 200, t: 'square', d: 0.08, g: 0.05 }],
  skip:       [{ f: 440, f2: 330, t: 'sine', d: 0.12, g: 0.1 }],
  heal:       [{ f: 660, f2: 990, t: 'sine', d: 0.15, g: 0.14 }, { f: 880, f2: 1320, t: 'sine', d: 0.25, g: 0.12, delay: 0.1 }],
  heartbeat:  [{ f: 60, f2: 40, t: 'sine', d: 0.18, g: 0.35 }, { f: 55, f2: 38, t: 'sine', d: 0.16, g: 0.28, delay: 0.25 }],
  buy:        [{ f: 660, f2: 990, t: 'triangle', d: 0.1, g: 0.14 }, { f: 1320, t: 'sine', d: 0.15, g: 0.1, delay: 0.08 }],
  denied:     [{ f: 220, f2: 160, t: 'square', d: 0.15, g: 0.08 }],
  death:      [{ f: 200, f2: 30, t: 'sawtooth', d: 1.2, g: 0.3, filter: { type: 'lowpass', f: 900, f2: 100 } }, { noise: true, d: 0.6, g: 0.2, filter: { type: 'lowpass', f: 600 } }],
  record:     [523, 659, 784, 1047, 1319, 1568].map((f, i) => ({ f, t: 'triangle', d: 0.3, g: 0.14, delay: i * 0.07 })),
  achievement:[{ f: 784, t: 'sine', d: 0.2, g: 0.15 }, { f: 1047, t: 'sine', d: 0.35, g: 0.15, delay: 0.15 }, { f: 1568, t: 'sine', d: 0.5, g: 0.12, delay: 0.3 }],
  evolution:  [262, 330, 392, 523, 659, 784, 1047, 1319].map((f, i) => ({ f, t: 'square', d: 0.3, g: 0.1, delay: i * 0.06, filter: { type: 'lowpass', f: 3000 } })),
  skill:      [{ f: 300, f2: 900, t: 'sawtooth', d: 0.2, g: 0.15, filter: { type: 'lowpass', f: 1500 } }, { noise: true, d: 0.25, g: 0.12, filter: { type: 'bandpass', f: 1200, q: 0.8 } }],
  victory:    [523, 523, 523, 659, 784, 1047, 1319, 1568, 2093].map((f, i) => ({ f, t: 'triangle', d: 0.4, g: 0.16, delay: i * 0.12 })),
  event:      [{ f: 440, f2: 660, t: 'triangle', d: 0.25, g: 0.14 }, { f: 660, f2: 880, t: 'triangle', d: 0.3, g: 0.12, delay: 0.2 }],
  phase:      [{ f: 70, f2: 140, t: 'sawtooth', d: 0.8, g: 0.3, filter: { type: 'lowpass', f: 600 } }, { noise: true, d: 0.5, g: 0.15, filter: { type: 'lowpass', f: 400 } }],
};

// Sonidos cortos de golpe por familia de elemento.
const HIT = {
  fuego:      [{ noise: true, d: 0.08, g: 0.1, filter: { type: 'bandpass', f: 1200, q: 0.8 } }, { f: 220, f2: 90, t: 'square', d: 0.06, g: 0.05 }],
  agua:       [{ f: 420, f2: 640, t: 'sine', d: 0.07, g: 0.09 }],
  tierra:     [{ f: 90, f2: 45, t: 'sine', d: 0.09, g: 0.16 }, { noise: true, d: 0.05, g: 0.06, filter: { type: 'lowpass', f: 400 } }],
  aire:       [{ noise: true, d: 0.07, g: 0.07, filter: { type: 'bandpass', f: 2500, q: 1.5 } }],
  luz:        [{ f: 1320, f2: 1760, t: 'sine', d: 0.06, g: 0.07 }],
  oscuridad:  [{ f: 160, f2: 70, t: 'sawtooth', d: 0.09, g: 0.07, filter: { type: 'lowpass', f: 500 } }],
  naturaleza: [{ f: 520, f2: 300, t: 'triangle', d: 0.07, g: 0.09 }],
};
const HIT_SPECIAL = {
  rayo:   [{ noise: true, d: 0.06, g: 0.1, filter: { type: 'highpass', f: 2500 } }, { f: 110, t: 'square', d: 0.04, g: 0.05 }],
  hielo:  [{ f: 1500, f2: 2200, t: 'sine', d: 0.06, g: 0.07 }, { noise: true, d: 0.04, g: 0.04, filter: { type: 'highpass', f: 4000 } }],
  metal:  [{ f: 900, f2: 700, t: 'square', d: 0.08, g: 0.06, filter: { type: 'bandpass', f: 1800, q: 4 } }],
  sangre: [{ noise: true, d: 0.08, g: 0.08, filter: { type: 'lowpass', f: 900 } }, { f: 150, f2: 60, t: 'sine', d: 0.08, g: 0.08 }],
  veneno: [{ f: 300, f2: 500, t: 'sine', d: 0.05, g: 0.06 }, { f: 380, f2: 600, t: 'sine', d: 0.05, g: 0.05, delay: 0.05 }],
};

// Sonidos al lanzar un poder, por familia.
const CAST = {
  fuego:      [{ noise: true, d: 0.18, g: 0.08, filter: { type: 'bandpass', f: 900, f2: 300, q: 0.7 } }],
  agua:       [{ f: 300, f2: 700, t: 'sine', d: 0.15, g: 0.07 }],
  tierra:     [{ f: 70, f2: 40, t: 'triangle', d: 0.2, g: 0.12 }],
  aire:       [{ noise: true, d: 0.2, g: 0.07, filter: { type: 'bandpass', f: 800, f2: 3000, q: 1.2 } }],
  luz:        [{ f: 880, f2: 1760, t: 'sine', d: 0.15, g: 0.06 }],
  oscuridad:  [{ f: 200, f2: 80, t: 'sawtooth', d: 0.2, g: 0.06, filter: { type: 'lowpass', f: 400 } }],
  naturaleza: [{ f: 400, f2: 250, t: 'triangle', d: 0.15, g: 0.06 }],
};

export class GameAudio {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.last = {};
    this.noise = null;
    // música
    this.theme = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.intensity = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.musicGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.settings.master;
    this.sfxGain.gain.value = this.settings.sfx;
    this.musicGain.gain.value = this.settings.music;
  }

  get sfxOn() { return this.ctx && this.settings.sfx > 0 && this.settings.master > 0; }

  // ─── Síntesis básica ───
  voice(n, out, t0, gainScale = 1) {
    const ctx = this.ctx;
    const start = t0 + (n.delay || 0);
    let src;
    if (n.noise) {
      src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    } else {
      src = ctx.createOscillator(); src.type = n.t || 'sine';
      src.frequency.setValueAtTime(n.f, start);
      if (n.f2) src.frequency.exponentialRampToValueAtTime(n.f2, start + n.d);
    }
    let node = src;
    if (n.filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = n.filter.type; fl.frequency.setValueAtTime(n.filter.f, start);
      if (n.filter.f2) fl.frequency.exponentialRampToValueAtTime(n.filter.f2, start + n.d);
      fl.Q.value = n.filter.q || 1;
      node.connect(fl); node = fl;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(n.g * gainScale, start + (n.a || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    node.connect(g); g.connect(out);
    src.start(start); src.stop(start + n.d + 0.05);
  }

  playDef(def, gainScale = 1) {
    if (!this.ensure() || !this.sfxOn) return;
    const t0 = this.ctx.currentTime;
    for (const n of def) this.voice(n, this.sfxGain, t0, gainScale);
  }

  limited(key, ms) {
    const now = performance.now();
    if (this.last[key] && now - this.last[key] < ms) return true;
    this.last[key] = now;
    return false;
  }

  play(name) {
    const def = SFX[name];
    if (!def || this.limited(name, name === 'heartbeat' ? 900 : 45)) return;
    this.playDef(def);
  }

  hit(element) {
    if (this.limited('hit', 35) || this.limited('hit:' + element, 70)) return;
    this.playDef(HIT_SPECIAL[element] || HIT[familyOf(element)] || HIT.luz, 0.8);
  }

  cast(element, kind) {
    if (kind === 'aura' || kind === 'orbit') return;
    if (this.limited('cast:' + element, 140)) return;
    this.playDef(CAST[familyOf(element)] || CAST.luz);
  }

  impact(element) {
    if (this.limited('impact:' + element, 90)) return;
    const fam = familyOf(element);
    const def = fam === 'tierra' ? [{ f: 80, f2: 30, t: 'sine', d: 0.25, g: 0.25 }, { noise: true, d: 0.2, g: 0.15, filter: { type: 'lowpass', f: 500 } }]
      : fam === 'fuego' ? [{ noise: true, d: 0.3, g: 0.2, filter: { type: 'lowpass', f: 1200, f2: 200 } }, { f: 120, f2: 40, t: 'sawtooth', d: 0.25, g: 0.12, filter: { type: 'lowpass', f: 600 } }]
      : element === 'rayo' || element === 'energia' ? [{ noise: true, d: 0.15, g: 0.2, filter: { type: 'highpass', f: 1500 } }, { f: 200, f2: 60, t: 'square', d: 0.12, g: 0.1 }]
      : [{ noise: true, d: 0.2, g: 0.14, filter: { type: 'bandpass', f: 1000, q: 0.8 } }, { f: 300, f2: 120, t: 'triangle', d: 0.15, g: 0.1 }];
    this.playDef(def);
  }

  // ─── Música ───
  startMusic(theme = 'menu') {
    if (!this.ensure()) return;
    if (this.theme === theme && this.timer) return;
    this.stopMusic();
    this.theme = theme;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 60);
  }

  stopMusic() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.theme = null;
  }

  setIntensity(n) { this.intensity = n; }

  schedule() {
    if (!this.ctx || this.settings.music <= 0) { this.nextTime = this.ctx ? this.ctx.currentTime + 0.1 : 0; return; }
    const bpm = this.theme === 'menu' ? 84 : 128 + this.intensity * 6;
    const stepDur = 60 / bpm / 4; // semicorcheas
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.step++;
      this.nextTime += stepDur;
    }
  }

  playStep(step, t, dur) {
    const out = this.musicGain;
    const bar = Math.floor(step / 16) % PROGRESSION.length;
    const chord = PROGRESSION[bar];
    const s16 = step % 16;
    const menu = this.theme === 'menu';
    // pad: acorde sostenido al inicio de cada compás
    if (s16 === 0) {
      for (const n of chord) {
        for (const det of [-4, 4]) {
          this.voice({ f: midi(n + 12), t: 'sine', d: dur * 16, g: menu ? 0.05 : 0.035, a: dur * 4 }, out, t);
          this.voice({ f: midi(n + 12) * Math.pow(2, det / 1200), t: 'triangle', d: dur * 16, g: 0.02, a: dur * 4 }, out, t);
        }
      }
    }
    if (menu) {
      // melodía suave
      if (s16 % 2 === 0) {
        const note = MENU_MELODY[(step / 2) % MENU_MELODY.length | 0];
        this.voice({ f: midi(note), t: 'sine', d: dur * 3.5, g: 0.07, a: 0.02 }, out, t);
      }
      if (s16 === 0 || s16 === 8) this.voice({ f: midi(chord[0] - 12), t: 'triangle', d: dur * 7, g: 0.08, a: 0.02 }, out, t);
      return;
    }
    // bajo en corcheas
    if (s16 % 2 === 0) {
      const oct = s16 % 4 === 0 ? 0 : 12;
      this.voice({ f: midi(chord[0] - 12 + oct), t: 'sawtooth', d: dur * 1.8, g: 0.09, filter: { type: 'lowpass', f: 500 } }, out, t);
    }
    // arpegio
    const arpNote = chord[GAME_ARP[s16 % 8]] + (this.intensity >= 3 ? 24 : 12);
    if (this.intensity >= 1 && (this.intensity >= 2 || s16 % 2 === 0)) {
      this.voice({ f: midi(arpNote), t: 'square', d: dur * 0.9, g: 0.04, filter: { type: 'lowpass', f: 2500 } }, out, t);
    }
    // batería
    if (s16 % 4 === 0) this.voice({ f: 150, f2: 40, t: 'sine', d: 0.18, g: 0.35 }, out, t); // bombo
    if (this.intensity >= 2 && (s16 === 4 || s16 === 12)) this.voice({ noise: true, d: 0.14, g: 0.14, filter: { type: 'highpass', f: 1500 } }, out, t); // redoblante
    if (this.intensity >= 2 && s16 % 2 === 1) this.voice({ noise: true, d: 0.04, g: 0.05, filter: { type: 'highpass', f: 6000 } }, out, t); // hi-hat
    if (this.intensity >= 3 && s16 % 4 === 2) this.voice({ noise: true, d: 0.08, g: 0.06, filter: { type: 'highpass', f: 5000 } }, out, t);
  }
}
