// Listens to the microphone (Web Speech API) and runs an action when a spoken
// phrase matches one of the commands. Browsers without speech recognition
// (e.g. Firefox) simply get no voice commands. Most browsers only allow the
// microphone after a user gesture, so call start() from a key press or click.
export class VoiceCommands {
  #recognition = null;
  #commands = [];
  #wanted = false;
  #handled = new Set();   // result indexes already acted on in this listening session

  constructor({ lang = 'sv-SE' } = {}) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;   // react as soon as the phrase is heard
    r.maxAlternatives = 3;
    r.onresult = e => this.#heard(e);
    // the browser stops listening after a while of silence: keep it going
    r.onend = () => { this.#handled.clear(); if (this.#wanted) this.#tryStart(); };
    r.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') this.#wanted = false;
    };
    this.#recognition = r;
  }

  get supported() { return this.#recognition !== null; }

  // pattern: a RegExp tested against what was said; action runs once per utterance
  on(pattern, action) {
    this.#commands.push({ pattern, action });
    return this;
  }

  start() {
    if (!this.#recognition || this.#wanted) return;
    this.#wanted = true;
    this.#tryStart();
  }

  #tryStart() {
    try { this.#recognition.start(); } catch { /* already listening */ }
  }

  #heard(e) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (this.#handled.has(i)) continue;
      const result = e.results[i];
      const texts = Array.from(result, alt => alt.transcript.toLowerCase());
      const command = this.#commands.find(c => texts.some(t => c.pattern.test(t)));
      if (!command) continue;
      this.#handled.add(i);   // interim results repeat: fire only once per utterance
      command.action();
    }
  }
}
