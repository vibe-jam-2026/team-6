// Low-level WebAudio synthesizer: tones and filtered noise, no sound files.
const VOLUME = 0.35;

export class SynthAudio {
  ctx = null;
  muted = false;
  #master = null;
  #noise = null;

  // Browsers only allow audio after a user gesture; call this on the first key press.
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.#master = this.ctx.createGain();
    this.#master.gain.value = this.muted ? 0 : VOLUME;
    this.#master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.#noise = this.ctx.createBuffer(1, len, len);
    const data = this.#noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.#master) this.#master.gain.value = this.muted ? 0 : VOLUME;
  }

  // Node other audio sources (e.g. music) connect to; follows mute and volume.
  get output() { return this.#master; }

  get #ready() { return this.ctx && !this.muted; }

  tone(freq, endFreq, dur, type = 'square', vol = 0.15, delay = 0) {
    if (!this.#ready) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.#master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.4, cutoff = 1200) {
    if (!this.#ready) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.#noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(60, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.#master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
}
