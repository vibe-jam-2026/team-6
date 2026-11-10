import { EVENTS } from '../core/EventBus.js';
import { sceneryForWave } from '../config.js';
import { MUSIC_STYLES, FINAL_BOSS_STYLE, bossVersion } from './musicStyles.js';

// Procedural background music: a small step sequencer on top of SynthAudio's
// AudioContext. No sound files. Call tick() every update; it schedules notes a
// little ahead of time so playback stays steady even when frames hitch.
//
// setMood(name) picks the track ('lobby', 'playing', 'paused', 'shop', 'gameover');
// setIntensity(n) adds layers as the waves go up, and the match tune takes its
// chords, melody, drums and instruments from the landscape's style (musicStyles.js).

const LOOKAHEAD = 0.15;   // seconds of music scheduled in advance
const MUSIC_VOLUME = 4; // gain into the compressor, before SynthAudio's master (0.35)

const hz = midi => 440 * 2 ** ((midi - 69) / 12);

// A minor: i - VI - III - VII, one chord per bar.
const PROGRESSION = [
  { bass: 33, chord: [69, 72, 76] }, // Am
  { bass: 29, chord: [65, 69, 72] }, // F
  { bass: 36, chord: [67, 72, 76] }, // C
  { bass: 31, chord: [67, 71, 74] }, // G
];
// Darker progression for the game-over screen: Am - F - Dm - E
const SAD_PROGRESSION = [
  { bass: 33, chord: [57, 60, 64] },
  { bass: 29, chord: [57, 60, 65] },
  { bass: 38, chord: [57, 62, 65] },
  { bass: 28, chord: [56, 59, 64] },
];
const ARP = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 1]; // chord-tone index per 16th

// Each track decides what plays on a given 16th-note step.
const TRACKS = {
  lobby: {
    bpm: 96,
    play(v, step, bar) {
      const { bass, chord } = PROGRESSION[bar % 4];
      if (step === 0) {
        chord.forEach(n => v.pad(hz(n - 12), v.beat * 4, 0.09));
        v.bass(hz(bass + 24), v.beat * 3.5, 0.22, 900);
      }
      if (step % 2 === 0) v.pluck(hz(chord[ARP[step]] + (step >= 8 ? 12 : 0)), 0.35, 0.16, 'triangle');
      if (step % 4 === 2) v.hat(0.08);
    },
  },
  playing: {
    bpm: 128, // the style's own tempo is used (see #bpm)
    play(v, step, bar, intensity, style) {
      const { bass, chord } = style.prog[bar % 4];
      // drums
      if (style.kick.includes(step)) v.kick(style.punch ? 0.6 : 0.45, style.punch);
      if (style.hats === 'offbeat' && step % 4 === 2) v.hat(0.12);
      if (style.hats === 'eighths' && step % 2 === 0) v.hat(step % 4 === 2 ? 0.12 : 0.06);
      if (intensity >= 2 && style.hats !== 'none' && step % 2 === 1) v.hat(0.05);
      if ((intensity >= 2 || style.boss) && style.snare.includes(step)) v.snare(0.3);
      // bass
      const cutoff = 900 + intensity * 300, root = bass + 12;
      switch (style.bass) {
        case 'ebm': {
          // root, root, octave, root… accented on the beat, ducked under the kick
          const jump = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 15, 12][step];
          v.bass(hz(root + jump), v.beat * 0.2, step % 4 === 0 ? 0.2 : 0.3, cutoff * (step % 4 === 2 ? 1.6 : 1.1));
          break;
        }
        case 'sixteenths': v.bass(hz(root + (step % 4 === 2 ? 12 : 0)), v.beat * 0.22, 0.26, cutoff); break;
        case 'pulse': if ([0, 6, 8, 14].includes(step)) v.bass(hz(root), v.beat * 0.6, 0.3, cutoff); break;
        case 'oompah':
          if (step === 0 || step === 8) v.bass(hz(root), v.beat * 0.8, 0.3, cutoff);
          if (step === 4 || step === 12) v.bass(hz(root + 7), v.beat * 0.6, 0.24, cutoff);
          break;
        case 'long': if (step === 0) v.bass(hz(root), v.beat * 3.8, 0.26, 600 + intensity * 150); break;
        default: if (step % 2 === 0) v.bass(hz(root + (step % 4 === 2 ? 12 : 0)), v.beat * 0.45, 0.3, cutoff);
      }
      if (style.pad && step === 0) chord.forEach(n => v.pad(hz(n - 12), v.beat * 4, 0.06));
      // chords on top
      if (intensity >= 1) {
        if (style.arp === 'stab') { if (step === 4 || step === 12) chord.forEach(n => v.pluck(hz(n), 0.15, 0.06, style.pluck)); }
        else if (style.arp === 'bells') { if (step % 4 === 0) v.pluck(hz(chord[ARP[step]] + 12), 0.9, 0.08, style.pluck); }
        else v.pluck(hz(chord[ARP[step]]), 0.12, 0.09, style.pluck);
      }
      // the melody comes in from the second wave
      if (intensity >= 2 && step % 2 === 0) {
        const note = style.melody[bar % 4][step / 2];
        if (note) v.lead(hz(note + 12), v.beat * (style.bass === 'long' ? 1.6 : 0.45), 0.09, style.lead);
      }
    },
  },
  // the victory lap gets the lobby theme, a little slower and grander
  get flyover() { return { ...TRACKS.lobby, bpm: 104 }; },
  gameover: {
    bpm: 72,
    play(v, step, bar) {
      const { bass, chord } = SAD_PROGRESSION[bar % 4];
      if (step === 0) {
        chord.forEach(n => v.pad(hz(n), v.beat * 4, 0.09));
        v.bass(hz(bass + 24), v.beat * 4, 0.2, 800);
      }
      if (step === 8 || step === 12) v.pluck(hz(chord[step === 8 ? 2 : 1] + 12), 0.6, 0.14, 'triangle');
    },
  },
};

export class MusicPlayer {
  #synth;
  #out = null;      // music gain
  #filter = null;   // lowpass, closed while paused
  #comp = null;     // evens out kick vs. melody so the tune is audible on small speakers
  #noise = null;
  #track = null;
  #trackName = null;
  #mood = null;
  #intensity = 1;
  #style = MUSIC_STYLES.forest;
  #nextTime = 0;
  #step = 0;
  #bar = 0;

  constructor(synth, bus) {
    this.#synth = synth;
    bus.on(EVENTS.WAVE_STARTED, ({ wave, boss, final }) => {
      this.setIntensity(wave);
      const style = MUSIC_STYLES[sceneryForWave(wave).key] ?? MUSIC_STYLES.forest;
      this.#style = final ? FINAL_BOSS_STYLE : boss ? bossVersion(style) : style;
    });
  }

  setIntensity(n) { this.#intensity = Math.max(1, Math.min(3, n)); }

  setMood(name) {
    if (name === this.#mood) return;
    const from = this.#mood;
    this.#mood = name;
    // pausing and shopping between waves keep the match tune, muffled
    const breather = n => n === 'paused' || n === 'shop';
    if (breather(name)) { this.#muffle(true); return; }
    this.#muffle(false);
    if (name === 'playing' && breather(from)) return; // resume the same tune
    if (name === 'playing') this.#intensity = 1;
    this.#start(TRACKS[name] ? name : null);
  }

  // Call regularly (every simulation step is fine).
  tick() {
    const ctx = this.#synth.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (!this.#out) this.#build(ctx);
    if (!this.#track) return;
    // after a hidden tab or a stall, don't try to catch up on missed notes
    if (this.#nextTime < ctx.currentTime) this.#nextTime = ctx.currentTime + 0.05;
    while (this.#nextTime < ctx.currentTime + LOOKAHEAD) {
      const stepDur = 60 / this.#bpm() / 4;
      if (!this.#synth.muted) {
        this.#track.play(this.#voices(this.#nextTime, stepDur * 4), this.#step, this.#bar, this.#intensity, this.#style);
      }
      this.#nextTime += stepDur;
      if (++this.#step === 16) { this.#step = 0; this.#bar++; }
    }
  }

  #bpm() {
    const t = this.#track;
    return this.#trackName === 'playing' ? this.#style.bpm + (this.#intensity - 1) * 4 : t.bpm;
  }

  #start(name) {
    this.#trackName = name;
    this.#track = name ? TRACKS[name] : null;
    this.#step = 0;
    this.#bar = 0;
    const ctx = this.#synth.ctx;
    if (ctx) this.#nextTime = ctx.currentTime + 0.05;
  }

  #build(ctx) {
    this.#filter = ctx.createBiquadFilter();
    this.#filter.type = 'lowpass';
    this.#filter.frequency.value = 18000;
    this.#out = ctx.createGain();
    this.#out.gain.value = MUSIC_VOLUME;
    this.#comp = ctx.createDynamicsCompressor();
    this.#comp.threshold.value = -26;
    this.#comp.knee.value = 10;
    this.#comp.ratio.value = 4;
    this.#comp.attack.value = 0.005;
    this.#comp.release.value = 0.15;
    this.#out.connect(this.#comp);
    this.#comp.connect(this.#filter);
    this.#filter.connect(this.#synth.output);
    const len = ctx.sampleRate / 2;
    this.#noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.#noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    if (this.#mood === 'paused' || this.#mood === 'shop') this.#muffle(true);
  }

  #muffle(on) {
    if (!this.#filter) return;
    const t = this.#synth.ctx.currentTime;
    this.#filter.frequency.setTargetAtTime(on ? 500 : 18000, t, 0.08);
    this.#out.gain.setTargetAtTime(on ? MUSIC_VOLUME * 0.6 : MUSIC_VOLUME, t, 0.08);
  }

  // Instrument set bound to one step's start time.
  #voices(t, beat) {
    const ctx = this.#synth.ctx, out = this.#out, noise = this.#noise;
    const env = (node, vol, attack, dur) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      node.connect(g); g.connect(out);
      return g;
    };
    const osc = (type, freq, dur) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      o.start(t); o.stop(t + dur + 0.05);
      return o;
    };
    const noiseHit = (dur, vol, type, freq) => {
      const s = ctx.createBufferSource(); s.buffer = noise;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      s.connect(f); env(f, vol, 0.002, dur);
      s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
    };
    return {
      beat,
      kick(vol, punch = false) {
        const o = osc('sine', punch ? 180 : 150, 0.3);
        o.frequency.exponentialRampToValueAtTime(punch ? 45 : 40, t + (punch ? 0.08 : 0.15));
        env(o, vol, 0.003, 0.28);
        if (punch) noiseHit(0.012, vol * 0.5, 'highpass', 3000); // beater click
      },
      hat: vol => noiseHit(0.05, vol, 'highpass', 7000),
      snare: vol => noiseHit(0.16, vol, 'bandpass', 1800),
      bass(freq, dur, vol, cutoff) {
        const o = osc('sawtooth', freq, dur);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass';
        f.frequency.setValueAtTime(cutoff * 2, t);
        f.frequency.exponentialRampToValueAtTime(cutoff * 0.5, t + dur);
        o.connect(f); env(f, vol, 0.005, dur);
      },
      pluck(freq, dur, vol, type) { env(osc(type, freq, dur), vol, 0.004, dur); },
      lead(freq, dur, vol, type = 'square') {
        const o = osc(type, freq, dur);
        o.detune.setValueAtTime(0, t);
        o.detune.linearRampToValueAtTime(-8, t + dur);
        env(o, vol, 0.01, dur);
      },
      pad(freq, dur, vol) {
        for (const d of [-7, 7]) {
          const o = osc('triangle', freq, dur);
          o.detune.value = d;
          env(o, vol, dur * 0.25, dur);
        }
      },
    };
  }
}
