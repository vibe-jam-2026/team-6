// The match music changes with the landscape. Each style is data for the one
// 'playing' track in MusicPlayer: chords, a melody, drums and instruments.
//   prog: 4 bars of { bass (MIDI root), chord (MIDI triad) }
//   melody: 4 bars of 8 eighth-notes (MIDI, null = rest), played an octave up
//   kick / snare: 16th steps that hit; hats: 'offbeat' | 'eighths' | 'none'
//   bass: 'eighths' | 'sixteenths' | 'pulse' | 'oompah' | 'long' | 'ebm' (gated 16ths with octave jumps)
//   punch: a harder, clicky kick
//   arp: 'arp' (broken chords on 8ths) | 'stab' (chord on beats 2 and 4) | 'bells' (high, sparse)
//   pluck / lead: oscillator types; pad: hold the chord each bar
// Wave numbers come in through sceneryForWave, so styles follow the landscapes.

const AM = [
  { bass: 33, chord: [69, 72, 76] }, { bass: 29, chord: [65, 69, 72] },
  { bass: 36, chord: [67, 72, 76] }, { bass: 31, chord: [67, 71, 74] },
];

export const MUSIC_STYLES = {
  // Swedish forest: the original A-minor drive
  forest: {
    bpm: 128, prog: AM, kick: [0, 4, 8, 12], snare: [4, 12], hats: 'offbeat', bass: 'eighths', arp: 'arp',
    pluck: 'square', lead: 'square',
    melody: [[76, null, 74, 76, null, 72, 74, null], [72, null, 69, null, 72, 74, null, null],
      [76, null, 79, null, 77, 76, 74, null], [74, null, 71, null, 74, null, null, null]],
  },
  // City coastline: bright D major, breezy
  coast: {
    bpm: 132, kick: [0, 8, 10], snare: [4, 12], hats: 'eighths', bass: 'pulse', arp: 'arp', pluck: 'triangle', lead: 'triangle',
    prog: [{ bass: 38, chord: [62, 66, 69] }, { bass: 35, chord: [62, 66, 71] }, { bass: 31, chord: [62, 67, 71] }, { bass: 33, chord: [61, 64, 69] }],
    melody: [[74, null, 73, 74, 76, null, 74, null], [78, null, 76, 74, null, 71, null, null],
      [74, null, 71, 74, 79, null, 78, 76], [76, null, 73, null, 69, null, null, null]],
  },
  // The Alps: E-major oom-pah with yodelling leaps
  alps: {
    bpm: 120, kick: [0, 8], snare: [4, 12], hats: 'none', bass: 'oompah', arp: 'stab', pluck: 'triangle', lead: 'triangle',
    prog: [{ bass: 28, chord: [64, 68, 71] }, { bass: 33, chord: [64, 69, 73] }, { bass: 35, chord: [63, 66, 71] }, { bass: 28, chord: [64, 68, 71] }],
    melody: [[71, null, 76, null, 80, 76, 71, null], [73, null, 76, null, 81, null, 76, null],
      [75, null, 78, null, 83, 78, 75, null], [76, null, 80, null, 76, null, null, null]],
  },
  // Fantasy realm: an epic D-minor march
  realm: {
    bpm: 112, kick: [0, 6, 8], snare: [4, 12, 14, 15], hats: 'none', bass: 'long', arp: 'arp', pluck: 'triangle', lead: 'sawtooth', pad: true,
    prog: [{ bass: 38, chord: [62, 65, 69] }, { bass: 34, chord: [62, 65, 70] }, { bass: 36, chord: [64, 67, 72] }, { bass: 33, chord: [61, 64, 69] }],
    melody: [[74, null, null, 72, 74, null, 77, null], [74, null, 70, null, 69, null, null, null],
      [72, null, null, 74, 76, null, 79, null], [77, null, 76, null, 73, null, null, null]],
  },
  // Sahara dunes: E Phrygian dominant over a doumbek-style beat
  desert: {
    bpm: 108, kick: [0, 6, 10], snare: [4, 12, 14], hats: 'offbeat', bass: 'pulse', arp: 'arp', pluck: 'sawtooth', lead: 'sawtooth',
    prog: [{ bass: 28, chord: [64, 68, 71] }, { bass: 29, chord: [65, 69, 72] }, { bass: 38, chord: [62, 65, 69] }, { bass: 28, chord: [64, 68, 71] }],
    melody: [[76, 77, 80, null, 77, 76, null, null], [77, null, 76, 74, 72, null, 74, null],
      [76, 77, 80, 81, 80, 77, 76, null], [74, 72, 71, null, 76, null, null, null]],
  },
  // Volcanic isles: fast, heavy C-sharp minor
  volcano: {
    bpm: 146, kick: [0, 3, 8, 11], snare: [4, 12], hats: 'eighths', bass: 'sixteenths', arp: 'arp', pluck: 'sawtooth', lead: 'sawtooth',
    prog: [{ bass: 37, chord: [61, 64, 68] }, { bass: 33, chord: [61, 64, 69] }, { bass: 30, chord: [61, 66, 69] }, { bass: 32, chord: [60, 63, 68] }],
    melody: [[73, null, null, 76, 75, null, 73, null], [73, null, 71, null, 69, null, null, null],
      [66, null, 69, null, 73, null, 76, 75], [75, null, null, 72, 68, null, null, null]],
  },
  // Arctic pack ice: sparse, cold bells in F-sharp minor
  arctic: {
    bpm: 98, kick: [0, 10], snare: [8], hats: 'offbeat', bass: 'long', arp: 'bells', pluck: 'sine', lead: 'sine', pad: true,
    prog: [{ bass: 30, chord: [66, 69, 73] }, { bass: 38, chord: [66, 69, 74] }, { bass: 33, chord: [64, 69, 73] }, { bass: 28, chord: [64, 68, 71] }],
    melody: [[85, null, null, null, 81, null, null, null], [86, null, null, null, 85, null, 81, null],
      [81, null, null, null, 78, null, null, null], [80, null, null, null, null, null, null, null]],
  },
  // Neon city: F-minor synthwave
  neon: {
    bpm: 116, kick: [0, 4, 8, 12], snare: [4, 12], hats: 'eighths', bass: 'sixteenths', arp: 'arp', pluck: 'square', lead: 'sawtooth', pad: true,
    prog: [{ bass: 29, chord: [65, 68, 72] }, { bass: 37, chord: [65, 68, 73] }, { bass: 32, chord: [63, 68, 72] }, { bass: 39, chord: [63, 67, 70] }],
    melody: [[77, null, 80, null, 79, 77, 75, null], [77, null, null, 73, 72, null, null, null],
      [75, null, 77, null, 79, null, 80, null], [79, null, 75, null, null, null, null, null]],
  },
  // The Moon: slow, eerie C Lydian
  moon: {
    bpm: 84, kick: [0], snare: [], hats: 'none', bass: 'long', arp: 'bells', pluck: 'sine', lead: 'sine', pad: true,
    prog: [{ bass: 36, chord: [64, 66, 71] }, { bass: 38, chord: [62, 66, 69] }, { bass: 40, chord: [64, 67, 71] }, { bass: 38, chord: [62, 66, 69] }],
    melody: [[78, null, null, null, 76, null, null, null], [74, null, null, null, null, null, 71, null],
      [79, null, null, null, 78, null, null, null], [76, null, null, null, null, null, null, null]],
  },
};

// The final boss (the Mothership) gets its own track whatever the landscape:
// pumping EBM in D minor. Four-to-the-floor kick, a gated sixteenth-note
// sawtooth bass jumping octaves, hard snare on 2 and 4, metallic stabs.
export const FINAL_BOSS_STYLE = {
  bpm: 132, kick: [0, 4, 8, 12], snare: [4, 12], hats: 'offbeat', bass: 'ebm', arp: 'stab', pluck: 'sawtooth', lead: 'square',
  punch: true, boss: true,
  prog: [{ bass: 38, chord: [62, 65, 69] }, { bass: 38, chord: [62, 65, 69] }, { bass: 34, chord: [62, 65, 70] }, { bass: 33, chord: [61, 64, 69] }],
  melody: [[74, null, null, 74, null, null, 77, null], [76, null, 74, null, null, null, null, null],
    [74, null, null, 74, null, null, 70, null], [69, null, null, 73, null, 76, null, null]],
};

// Boss waves keep the landscape's tune but push it: faster, a kick on every
// beat and the snare in from the start.
export function bossVersion(style) {
  return { ...style, bpm: style.bpm + 16, kick: [...new Set([...style.kick, 0, 4, 8, 12])], snare: style.snare.length ? style.snare : [4, 12], boss: true };
}
